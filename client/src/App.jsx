import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ConfirmProvider } from './contexts/ConfirmContext.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ConfirmProvider>
    </BrowserRouter>
  );
}
