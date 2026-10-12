import { useState } from "react";
import EditGate, { editTitle } from "../../components/common/EditGate";
import useEditForm from "../../utils/useEditForm";
import { useConfirm } from "../../components/common/ConfirmDialog";
import { useNavigate, useParams } from "react-router-dom";
import CourseForm from "../../components/course/CourseForm";
import FormPage from "../../components/course/FormPage";
import { courseToForm, coursePayload } from "../../components/course/courseFormModel";
import { deleteCourse, getTeacherCourse, updateCourse } from "../../services/courseService";

export default function EditCoursePage() {
  const confirm = useConfirm();
  const { id } = useParams();
  const navigate = useNavigate();
  const edit = useEditForm(async () => {
    const course = await getTeacherCourse(id);
    return { course, form: courseToForm(course) };
  }, [id]);
  const course = edit.extra.course;
  const [state, setState] = useState({ saving: false, error: "" });

  async function save(form) {
    setState({ saving: true, error: "" });
    try {
      await updateCourse(id, { ...coursePayload(form), status: course.status });
      navigate(`/teacher/courses/${id}`);
    } catch (error) {
      setState({
        saving: false,
        error: error.response?.data?.message || "Không thể cập nhật khóa học",
      });
    }
  }

  async function remove() {
    if (
      !(await confirm({
        message: `Xóa khóa học “${course.title}”?`,
        title: "Xóa khóa học",
        confirmLabel: "Xóa",
        danger: true,
      }))
    )
      return;
    try {
      await deleteCourse(id);
      navigate("/teacher/courses", { replace: true });
    } catch (error) {
      setState({ saving: false, error: error.response?.data?.message || "Không thể xóa khóa học" });
    }
  }

  const crumbs = [
    { label: "Khóa học", to: "/teacher/courses" },
    ...(course ? [{ label: course.title, to: `/teacher/courses/${id}` }] : []),
  ];

  if (!edit.ready)
    return <EditGate edit={edit} back={{ label: "Khóa học", to: "/teacher/courses" }} />;

  return (
    <FormPage crumbs={crumbs} title={editTitle(true, course.title)} error={state.error}>
      <CourseForm
        initialValues={edit.form}
        submitting={state.saving}
        cancelTo={`/teacher/courses/${id}`}
        onSubmit={save}
      />
      <div className="cs-danger-row">
        <button type="button" className="btn btn-link cs-btn-danger-link" onClick={remove}>
          Xóa khóa học
        </button>
      </div>
    </FormPage>
  );
}
