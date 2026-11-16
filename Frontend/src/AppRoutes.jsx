import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import AuthLayout from "./layouts/AuthLayout";
import UserLayout from "./layouts/UserLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import ClassesPage from "./pages/admin/ClassesPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import HomePage from "./pages/user/HomePage";
import ProfilePage from "./pages/user/ProfilePage";
import CourseDetailPage from "./pages/user/CourseDetailPage";
import LearningPage from "./pages/user/LearningPage";
import CourseManagementPage from "./pages/teacher/CourseManagementPage";
import CreateCoursePage from "./pages/teacher/CreateCoursePage";
import TeacherCourseDetailPage from "./pages/teacher/TeacherCourseDetailPage";
import EditCoursePage from "./pages/teacher/EditCoursePage";
import TeacherWeekPage from "./pages/teacher/TeacherWeekPage";
import TeacherLessonPage from "./pages/teacher/TeacherLessonPage";
import WeekLessonEditorPage from "./pages/teacher/WeekLessonEditorPage";
import WeekEditorPage from "./pages/teacher/WeekEditorPage";
import ClassEditorPage from "./pages/teacher/ClassEditorPage";
import GrammarEditorPage from "./pages/teacher/GrammarEditorPage";
import FlashcardEditorPage from "./pages/teacher/FlashcardEditorPage";
import ListeningEditorPage from "./pages/teacher/ListeningEditorPage";
import ReadingEditorPage from "./pages/teacher/ReadingEditorPage";
import SpeakingEditorPage from "./pages/teacher/SpeakingEditorPage";
import QuestionEditorPage from "./pages/teacher/QuestionEditorPage";
import GrammarDetailPage from "./pages/user/GrammarDetailPage";
import FlashcardDetailPage from "./pages/user/FlashcardDetailPage";
import PersonalFlashcardEditorPage from "./pages/user/PersonalFlashcardEditorPage";
import StudentDashboardPage from "./pages/user/DashboardPage";
import TeacherDashboardPage from "./pages/teacher/TeacherDashboardPage";
import UsersPage from "./pages/admin/UsersPage";
import AdminUserDetailPage from "./pages/admin/AdminUserDetailPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import ReportsPage from "./pages/admin/ReportsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminRevenuePage from "./pages/admin/AdminRevenuePage";
import PaymentSettingsPage from "./pages/admin/PaymentSettingsPage";
import ClassManagementPage from "./pages/teacher/ClassManagementPage";
import ClassDetailPage from "./pages/teacher/ClassDetailPage";
import StudentClassDetailPage from "./pages/user/StudentClassDetailPage";
import ListeningPage from "./pages/user/ListeningPage";
import ReadingPage from "./pages/user/ReadingPage";
import SpeakingPage from "./pages/user/SpeakingPage";
import MyCoursesPage from "./pages/user/MyCoursesPage";
import ReviewPage from "./pages/user/ReviewPage";
import ResultsPage from "./pages/user/ResultsPage";
import OrderPage from "./pages/user/OrderPage";
import MaterialViewPage from "./pages/teacher/MaterialViewPage";
import MaterialLibraryPage from "./pages/teacher/MaterialLibraryPage";
import TestBankEditorPage from "./pages/teacher/TestBankEditorPage";
import QuestionSetEditorPage from "./pages/teacher/QuestionSetEditorPage";
import QuestionBankPage from "./pages/teacher/QuestionBankPage";
import FinalTestEditorPage from "./pages/teacher/FinalTestEditorPage";
import FinalTestGradingPage from "./pages/teacher/FinalTestGradingPage";
import FinalTestPage from "./pages/user/FinalTestPage";

// A different resource must not inherit answers, recordings or edit forms from the previous one.
function DetailPage({ component: Component, ...props }) {
  const { id, code } = useParams();
  return <Component key={id ?? code} {...props} />;
}

// Trình xây cấu trúc cũ (/content?week=) → trang khóa học; có tuần thì mở trang tuần.
function CourseContentRedirect() {
  const { id } = useParams();
  const { search } = useLocation();
  const week = new URLSearchParams(search).get("week");
  return (
    <Navigate
      to={week ? `/teacher/courses/${id}/weeks/${week}` : `/teacher/courses/${id}`}
      replace
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<UserLayout />}>
        <Route index element={<HomePage />} />

        <Route element={<ProtectedRoute roles={["STUDENT"]} />}>
          <Route path="user/profile" element={<ProfilePage />} />
          <Route path="user/classes" element={<Navigate to="/courses" replace />} />
          <Route path="student/classes" element={<Navigate to="/courses" replace />} />
          <Route
            path="student/classes/:id"
            element={<DetailPage component={StudentClassDetailPage} />}
          />
          <Route path="courses" element={<MyCoursesPage />} />
          <Route path="courses/:id" element={<DetailPage component={CourseDetailPage} />} />
          <Route path="courses/:id/test" element={<FinalTestPage />} />
          <Route path="courses/:id/test/attempts/:attemptId" element={<FinalTestPage />} />
          <Route path="lessons/:id" element={<DetailPage component={LearningPage} />} />
          <Route path="grammar" element={<Navigate to="/courses" replace />} />
          <Route path="grammar/:id" element={<DetailPage component={GrammarDetailPage} />} />
          <Route path="flashcards" element={<ReviewPage />} />
          <Route path="review" element={<Navigate to="/flashcards" replace />} />
          <Route path="flashcards/personal/new" element={<PersonalFlashcardEditorPage />} />
          <Route
            path="flashcards/personal/:id/edit"
            element={<DetailPage component={PersonalFlashcardEditorPage} />}
          />
          <Route path="flashcards/:id" element={<DetailPage component={FlashcardDetailPage} />} />
          <Route path="listening/:id" element={<DetailPage component={ListeningPage} />} />
          <Route path="reading/:id" element={<DetailPage component={ReadingPage} />} />
          <Route path="speaking/:id" element={<DetailPage component={SpeakingPage} />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="orders" element={<Navigate to="/results?tab=orders" replace />} />
          <Route path="orders/:code" element={<DetailPage component={OrderPage} />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="progress" element={<Navigate to="/results?tab=progress" replace />} />
          <Route path="history" element={<Navigate to="/results?tab=history" replace />} />
        </Route>

        <Route element={<ProtectedRoute roles={["TEACHER"]} />}>
          <Route path="teacher/courses/:id/test" element={<FinalTestEditorPage />} />
          <Route
            path="teacher/courses/:id/test/attempts/:attemptId"
            element={<FinalTestGradingPage />}
          />
          <Route path="teacher/profile" element={<ProfilePage />} />
          <Route path="teacher/courses" element={<CourseManagementPage />} />
          <Route path="teacher/courses/new" element={<CreateCoursePage />} />
          <Route
            path="teacher/courses/:id"
            element={<DetailPage component={TeacherCourseDetailPage} />}
          />
          <Route
            path="teacher/courses/:id/edit"
            element={<DetailPage component={EditCoursePage} />}
          />
          <Route path="teacher/courses/:id/content" element={<CourseContentRedirect />} />
          <Route path="teacher/courses/:courseId/weeks/:weekId" element={<TeacherWeekPage />} />
          <Route
            path="teacher/courses/:courseId/weeks/:weekId/edit"
            element={<DetailPage component={WeekEditorPage} />}
          />
          <Route
            path="teacher/courses/:courseId/weeks/:weekId/lessons/new"
            element={<WeekLessonEditorPage />}
          />
          <Route
            path="teacher/lessons/:id/week-edit"
            element={<DetailPage component={WeekLessonEditorPage} />}
          />
          <Route path="teacher/classes" element={<ClassManagementPage />} />
          <Route path="teacher/classes/new" element={<ClassEditorPage />} />
          <Route
            path="teacher/classes/:id/edit"
            element={<DetailPage component={ClassEditorPage} />}
          />
          <Route path="teacher/classes/:id" element={<DetailPage component={ClassDetailPage} />} />
          <Route
            path="teacher/lessons/:id"
            element={<DetailPage component={TeacherLessonPage} />}
          />
          {/* Trình soạn bài giảng đã bỏ: link cũ về trang bài học. */}
          <Route path="teacher/lessons/:id/edit" element={<LessonEditRedirect />} />
          <Route path="teacher/library" element={<MaterialLibraryPage />} />
          <Route
            path="teacher/grammar"
            element={<Navigate to="/teacher/library?type=GRAMMAR" replace />}
          />
          <Route path="teacher/grammar/new" element={<GrammarEditorPage />} />
          <Route path="teacher/grammar/:id" element={<MaterialViewPage type="GRAMMAR" />} />
          <Route
            path="teacher/grammar/:id/edit"
            element={<DetailPage component={GrammarEditorPage} mode="info" />}
          />
          <Route
            path="teacher/grammar/:id/content"
            element={<DetailPage component={GrammarEditorPage} mode="content" />}
          />
          <Route
            path="teacher/flashcards"
            element={<Navigate to="/teacher/library?type=FLASHCARD" replace />}
          />
          <Route path="teacher/flashcards/new" element={<FlashcardEditorPage />} />
          <Route path="teacher/flashcards/:id" element={<MaterialViewPage type="FLASHCARD" />} />
          <Route
            path="teacher/flashcards/:id/edit"
            element={<DetailPage component={FlashcardEditorPage} mode="info" />}
          />
          <Route
            path="teacher/flashcards/:id/content"
            element={<DetailPage component={FlashcardEditorPage} mode="content" />}
          />
          <Route
            path="teacher/listening"
            element={<Navigate to="/teacher/library?type=LISTENING" replace />}
          />
          <Route path="teacher/listening/new" element={<ListeningEditorPage />} />
          <Route path="teacher/listening/:id" element={<MaterialViewPage type="LISTENING" />} />
          <Route
            path="teacher/listening/:id/edit"
            element={<DetailPage component={ListeningEditorPage} mode="info" />}
          />
          <Route
            path="teacher/listening/:id/content"
            element={<DetailPage component={ListeningEditorPage} mode="content" />}
          />
          <Route
            path="teacher/reading"
            element={<Navigate to="/teacher/library?type=READING" replace />}
          />
          <Route path="teacher/reading/new" element={<ReadingEditorPage />} />
          <Route path="teacher/reading/:id" element={<MaterialViewPage type="READING" />} />
          <Route
            path="teacher/reading/:id/edit"
            element={<DetailPage component={ReadingEditorPage} mode="info" />}
          />
          <Route
            path="teacher/reading/:id/content"
            element={<DetailPage component={ReadingEditorPage} mode="content" />}
          />
          <Route
            path="teacher/speaking"
            element={<Navigate to="/teacher/library?type=SPEAKING" replace />}
          />
          <Route path="teacher/speaking/new" element={<SpeakingEditorPage />} />
          <Route path="teacher/speaking/:id" element={<MaterialViewPage type="SPEAKING" />} />
          <Route
            path="teacher/speaking/:id/edit"
            element={<DetailPage component={SpeakingEditorPage} mode="info" />}
          />
          <Route
            path="teacher/speaking/:id/content"
            element={<DetailPage component={SpeakingEditorPage} mode="content" />}
          />
          <Route path="teacher/questions" element={<QuestionBankPage />} />
          <Route path="teacher/test-bank/question-sets/new" element={<QuestionSetEditorPage />} />
          <Route
            path="teacher/test-bank/question-sets/:id/edit"
            element={<DetailPage component={QuestionSetEditorPage} />}
          />
          <Route path="teacher/test-bank/:type/new" element={<TestBankEditorPage />} />
          <Route
            path="teacher/test-bank/:type/:id/edit"
            element={<DetailPage component={TestBankEditorPage} />}
          />
          <Route path="teacher/questions/new" element={<QuestionEditorPage />} />
          <Route
            path="teacher/questions/:id/edit"
            element={<DetailPage component={QuestionEditorPage} />}
          />
          <Route path="teacher/dashboard" element={<TeacherDashboardPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<DetailPage component={AdminUserDetailPage} />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="revenue" element={<AdminRevenuePage />} />
          <Route path="payment-settings" element={<PaymentSettingsPage />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function LessonEditRedirect() {
  const { id } = useParams();
  return <Navigate to={`/teacher/lessons/${id}`} replace />;
}
