import { Navigate, Route, Routes } from 'react-router-dom'
import RequireRole from './auth/RequireRole.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Courses from './pages/Courses.jsx'
import CourseDetail from './pages/CourseDetail.jsx'
import LessonPage from './pages/LessonPage.jsx'
import MyLearning from './pages/MyLearning.jsx'
import MyCourses from './pages/MyCourses.jsx'
import CourseNew from './pages/CourseNew.jsx'
import CourseEdit from './pages/CourseEdit.jsx'
import CourseStudents from './pages/CourseStudents.jsx'
import AdminCategories from './pages/AdminCategories.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import NotFound from './pages/NotFound.jsx'

function Protected({ roles, children }) {
  return (
    <RequireRole roles={roles}>
      <Layout>{children}</Layout>
    </RequireRole>
  )
}

export default function App() {
  const everyone = ['student', 'instructor', 'admin']

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/courses" replace />} />

      <Route
        path="/courses"
        element={
          <Protected roles={everyone}>
            <Courses />
          </Protected>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <Protected roles={everyone}>
            <CourseDetail />
          </Protected>
        }
      />
      <Route
        path="/courses/:id/lessons/:lessonId"
        element={
          <Protected roles={everyone}>
            <LessonPage />
          </Protected>
        }
      />

      <Route
        path="/my-learning"
        element={
          <Protected roles={['student']}>
            <MyLearning />
          </Protected>
        }
      />

      <Route
        path="/my-courses"
        element={
          <Protected roles={['instructor']}>
            <MyCourses />
          </Protected>
        }
      />
      <Route
        path="/my-courses/new"
        element={
          <Protected roles={['instructor']}>
            <CourseNew />
          </Protected>
        }
      />
      <Route
        path="/my-courses/:id/edit"
        element={
          <Protected roles={['instructor']}>
            <CourseEdit />
          </Protected>
        }
      />
      <Route
        path="/my-courses/:id/students"
        element={
          <Protected roles={['instructor']}>
            <CourseStudents />
          </Protected>
        }
      />

      <Route
        path="/admin/categories"
        element={
          <Protected roles={['admin']}>
            <AdminCategories />
          </Protected>
        }
      />
      <Route
        path="/admin/users"
        element={
          <Protected roles={['admin']}>
            <AdminUsers />
          </Protected>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
