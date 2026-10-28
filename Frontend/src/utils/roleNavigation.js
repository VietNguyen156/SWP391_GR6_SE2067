const roleHomes = {
  ADMIN: "/admin",
  TEACHER: "/teacher/dashboard",
  STUDENT: "/dashboard",
};

const rolePrefixes = {
  ADMIN: ["/admin"],
  TEACHER: ["/teacher"],
  STUDENT: [
    "/user",
    "/student",
    "/dashboard",
    "/courses",
    "/lessons",
    "/grammar",
    "/listening",
    "/speaking",
    "/flashcards",
    "/flashcards",
    "/results",
    "/progress",
    "/history",
    "/orders",
  ],
};

export function homeForRole(role) {
  return roleHomes[role] || "/";
}

export function canRoleAccessPath(role, path) {
  if (!path || typeof path !== "string" || !path.startsWith("/") || path.startsWith("//"))
    return false;
  // So khớp theo pathname; giữ nguyên ?query (ví dụ ?week=) khi chuyển hướng.
  const pathname = path.split(/[?#]/)[0];
  return (rolePrefixes[role] || []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function loginDestination(role, requestedPath) {
  return canRoleAccessPath(role, requestedPath) ? requestedPath : homeForRole(role);
}
