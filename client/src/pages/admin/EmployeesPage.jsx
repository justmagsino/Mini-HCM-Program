import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { PageContainer } from '../../components/ui/PageContainer.jsx';
import { PaginatedTable } from '../../components/ui/PaginatedTable.jsx';
import { ErrorBanner } from '../../components/ui/ErrorBanner.jsx';
import { FilterBar } from '../../components/ui/FilterBar.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Button } from '../../components/ui/Button.jsx';
import * as adminApi from '../../api/admin.api.js';
import { getApiErrorMessage } from '../../api/axios.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';

export function EmployeesPage() {
  const { profile, refreshProfile } = useAuth();
  const [qInput, setQInput] = useState('');
  const q = useDebouncedValue(qInput);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [roleUpdatingUid, setRoleUpdatingUid] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listUsers({
        q: q || undefined,
        role: role || undefined,
        page,
        limit: 20,
      });
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [q, role, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRoleChange = async (uid, newRole) => {
    setRoleUpdatingUid(uid);
    setError('');
    try {
      await adminApi.updateUserRole(uid, newRole);
      if (uid === profile?.uid) {
        await refreshProfile();
      }
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRoleUpdatingUid(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Employees"
        description="Search and manage employee profiles and roles."
      />

      <ErrorBanner message={error} onRetry={load} />

      <FilterBar>
        <Input
          type="search"
          placeholder="Search name or email"
          value={qInput}
          onChange={(e) => {
            setPage(1);
            setQInput(e.target.value);
          }}
          className="min-w-[200px] flex-1"
          aria-label="Search employees"
        />
        <Select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
          inputSize="sm"
          className="w-auto min-w-[10rem]"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
        </Select>
        <Button type="button" size="sm" onClick={load}>
          Search
        </Button>
      </FilterBar>

      <PaginatedTable
        columns={[
          {
            key: 'fullName',
            label: 'Name',
            render: (row) => (
              <Link to={`/admin/employees/${row.uid}`} className="link-primary">
                {row.fullName}
              </Link>
            ),
          },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          {
            key: 'schedule',
            label: 'Shift',
            render: (row) => `${row.schedule?.start} – ${row.schedule?.end}`,
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <Select
                value={row.role}
                onChange={(e) => handleRoleChange(row.uid, e.target.value)}
                disabled={loading || roleUpdatingUid === row.uid}
                inputSize="sm"
                className="w-auto min-w-[7rem]"
                aria-label={`Change role for ${row.fullName}`}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </Select>
            ),
          },
        ]}
        rows={data.items}
        rowKey={(row) => row.uid}
        loading={loading}
        page={page}
        limit={data.limit}
        total={data.total}
        onPageChange={setPage}
        emptyTitle="No employees found"
        emptyMessage="No employees match your search."
      />
    </PageContainer>
  );
}
