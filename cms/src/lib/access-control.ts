import type { AuthProfile, AuthRole } from '../store/auth-store';

export const TEACHER_ROLE_ID = '196ebc8c-581c-481a-a90c-dc3e5f2772d7';

const stripAccent = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const isTeacherRole = (role: AuthRole) => {
  const roleId = String(role.id ?? '').trim();
  if (roleId && roleId === TEACHER_ROLE_ID) {
    return true;
  }

  const normalizedName = stripAccent(String(role.name ?? ''));
  return normalizedName.includes('giao vien') || normalizedName.includes('teacher');
};

export const isTeacherProfile = (profile: AuthProfile | null | undefined) => {
  if (!profile || !Array.isArray(profile.soRoles)) {
    return false;
  }

  return profile.soRoles.some(isTeacherRole);
};

const teacherAllowedPathRules = [/^\/$/, /^\/classes(?:\/[^/]+)?\/?$/, /^\/students(?:\/[^/]+)?\/?$/];

export const isTeacherAllowedPath = (pathname: string) =>
  teacherAllowedPathRules.some((rule) => rule.test(pathname));

export const getDefaultRouteForProfile = (profile: AuthProfile | null | undefined) =>
  isTeacherProfile(profile) ? '/' : '/';
