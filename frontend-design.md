# Frontend Design

This frontend is a role-based React app organized around layouts, route guards, and page modules for students, teachers, and administrators.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Browser / User                                                             │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ App.jsx                                                                    │
│ - ToastProvider                                                            │
│ - ConfirmProvider                                                          │
│ - AppRoutes()                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ AppRoutes.jsx                                                              │
│ - public auth pages: /login, /register, /forgot-password, /reset-password │
│ - role-protected routes: STUDENT, TEACHER, ADMIN                          │
│ - layout selection: UserLayout, AuthLayout, AdminLayout                  │
│ - route guard: ProtectedRoute                                             │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
          ┌──────────────────────────┬──────────────────────────┬───────────────┐
          │                          │                          │               │
          ▼                          ▼                          ▼               ▼
┌──────────────────────┐  ┌──────────────────────────────┐  ┌──────────────────────┐
│ AuthLayout           │  │ UserLayout                  │  │ AdminLayout          │
│ - brand + auth hero  │  │ - app navbar                │  │ - admin topbar       │
│ - login/register UI  │  │ - student/teacher shell     │  │ - sidebar            │
│ - redirect if logged │  │ - footer                   │  │ - main content area   │
└──────────────────────┘  │ - teacher studio mode       │  └──────────────────────┘
                           │ - mobile nav / profile     │
                           └──────────────────────────────┘

                                     │
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      │                              │                              │
      ▼                              ▼                              ▼
┌──────────────────────┐      ┌──────────────────────────────┐  ┌──────────────────────┐
│ Auth pages           │      │ Student experience          │  │ Admin dashboard      │
│ - LoginPage          │      │ - HomePage                 │  │ - DashboardPage      │
│ - RegisterPage       │      │ - MyCoursesPage            │  │ - UsersPage          │
│ - ForgotPasswordPage │      │ - LearningPage             │  │ - ClassesPage        │
│ - ResetPasswordPage  │      │ - ResultsPage              │  │ - ReportsPage        │
│                      │      │ - CourseDetailPage         │  │ - RevenuePage        │
│                      │      │ - ReadingPage / Listening  │  │ - OrdersPage        │
│                      │      │ - SpeakingPage             │  │ - PaymentSettings    │
└──────────────────────┘      │ - Grammar / Flashcards     │  └──────────────────────┘
                              │ - ProfilePage              │
                              └──────────────────────────────┘

                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Teacher Studio                                                             │
│ - CourseManagementPage                                                     │
│ - CreateCoursePage / EditCoursePage                                        │
│ - TeacherCourseDetailPage / TeacherWeekPage                                │
│ - ClassManagementPage / ClassDetailPage                                    │
│ - MaterialLibraryPage / MaterialViewPage                                   │
│ - Grammar / Flashcard / Listening / Reading / Speaking editors            │
│ - QuestionBankPage / QuestionEditorPage                                   │
│ - FinalTestEditorPage / FinalTestGradingPage                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ ProtectedRoute                                                             │
│ - checks auth state                                                       │
│ - shows loading state                                                      │
│ - redirects to /login when unauthenticated                                │
│ - redirects to /unauthorized when role is not allowed                     │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Shared frontend building blocks                                            │
│ - contexts/AuthContext.jsx                                                 │
│ - components/common/*                                                      │
│ - components/admin/*                                                       │
│ - components/course/*                                                      │
│ - components/teacher/* / material-view / learning / progress / grammar    │
│ - utils/*                                                                  │
│ - services/* (authService, courseService, orderService, ... )              │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ Backend API / Data layer                                                    │
│ - axios client                                                             │
│ - business services for auth, courses, orders, learning, admin, media    │
│ - API responses drive page state and UI components                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

## High-level flow

```text
User logs in
   │
   ▼
AuthContext verifies session
   │
   ├── if signed out -> redirect to /login
   ├── if STUDENT -> UserLayout + student pages
   ├── if TEACHER -> UserLayout + Teacher Sidebar / Studio pages
   └── if ADMIN -> AdminLayout + admin pages
```

## Layout responsibilities

- AuthLayout: public sign-in experience with a branded learning story and auth forms.
- UserLayout: shared shell for the student app, including top nav, profile details, dashboard routes, footer, and teacher studio transition.
- AdminLayout: admin-only shell with topbar and sidebar navigation.
- ProtectedRoute: enforces authentication and authorization before rendering protected screens.

## Frontend structure summary

- src/pages: route-level screens grouped by role and feature area.
- src/layouts: top-level page wrappers.
- src/components: reusable UI blocks and feature-specific widgets.
- src/contexts: global auth/session state.
- src/services: API access and domain-specific fetch logic.
- src/utils: helpers for navigation, formatting, curriculum, and form state.
- src/styles: global CSS tokens and shared design system foundations.

This structure keeps the app role-based while reusing a single shared component library and service layer.
