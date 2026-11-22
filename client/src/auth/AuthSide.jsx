export default function AuthSide({ mode }) {
  return (
    <aside className="auth-panel">
      <div className="auth-logo">Lectern</div>

      {mode === 'login' ? (
        <div className="auth-panel-body">
          <p className="auth-kicker">Who uses Lectern</p>
          <div className="auth-item">
            <h3>Students</h3>
            <p>Enroll in a course, open its lessons and mark them complete. A progress bar shows how far along you are.</p>
          </div>
          <div className="auth-item">
            <h3>Instructors</h3>
            <p>Create courses and lessons, keep them as drafts until ready, then publish. See who enrolled.</p>
          </div>
          <div className="auth-item">
            <h3>Admins</h3>
            <p>Manage categories and users, and keep the catalogue organised.</p>
          </div>
        </div>
      ) : (
        <div className="auth-panel-body">
          <p className="auth-kicker">How it works</p>
          <ol className="auth-steps">
            <li>
              <span className="auth-number">01</span>
              <span>Create an account and choose a role.</span>
            </li>
            <li>
              <span className="auth-number">02</span>
              <span>Browse the course catalogue or start your own course.</span>
            </li>
            <li>
              <span className="auth-number">03</span>
              <span>Open lessons, track progress, publish when ready.</span>
            </li>
          </ol>
        </div>
      )}

      <p className="auth-footer">Ilia State University · Web Programming · Team 04</p>
    </aside>
  )
}
