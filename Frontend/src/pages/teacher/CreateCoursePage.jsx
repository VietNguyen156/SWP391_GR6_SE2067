import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CourseForm from "../../components/course/CourseForm";
import FormPage from "../../components/course/FormPage";
import { coursePayload, emptyCourseForm } from "../../components/course/courseFormModel";
import { createCourse } from "../../services/courseService";

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const [state, setState] = useState({ saving: false, error: "" });

  async function create(form) {
    setState({ saving: true, error: "" });
    try {
      const created = await createCourse({
        ...coursePayload(form),
        status: "DRAFT",
      });
      navigate(`/teacher/courses/${created.id}`, { replace: true });
    } catch (error) {
      setState({
        saving: false,
        error: error.response?.data?.message || "Không thể tạo khóa học",
      });
    }
  }

  return (
    <FormPage
      crumbs={[{ label: "Khóa học", to: "/teacher/courses" }]}
      title="Tạo khóa học"
      error={state.error}
    >
      <CourseForm
        initialValues={emptyCourseForm}
        submitting={state.saving}
        cancelTo="/teacher/courses"
        onSubmit={create}
      />
    </FormPage>
  );
}
