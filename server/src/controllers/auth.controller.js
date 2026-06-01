import * as authService from '../services/auth.service.js';

export async function register(req, res) {
  const { fullName } = req.validated.body;
  const user = await authService.registerProfile(req.auth.uid, req.auth.email, fullName);
  return res.status(201).json(user);
}

export async function getMe(req, res) {
  return res.status(200).json(req.user);
}

export async function logout(req, res) {
  return res.status(204).send();
}
