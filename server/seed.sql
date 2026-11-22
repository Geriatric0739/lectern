-- Seed data for Lectern.
-- Demo accounts: student@example.com/student, instructor@example.com/instructor, admin@example.com/admin

INSERT INTO users (id, full_name, email, password_hash, role, created_at) VALUES
  (1, 'Admin User', 'admin@example.com', '$2b$10$S6XBM0Y3i3E8ykHdi9aNlOFVrNLrin/VzubcRFu8OBRNR.3y.yLq.', 'admin', '2026-08-28 10:00:00'),
  (2, 'Instructor User', 'instructor@example.com', '$2b$10$YUMCYbCf1WTFf7wjzuMkaOVQyZE3cMEIECcM.RXpQFb1.NeBxX/1K', 'instructor', '2026-08-29 10:00:00'),
  (3, 'Student User', 'student@example.com', '$2b$10$WRDf.hy8Pc/PWPSOmB22XOAsU3sZ29UzZmuYNfk..ucsRNIYXSORu', 'student', '2026-08-30 10:00:00');

INSERT INTO categories (id, name, created_at) VALUES
  (1, 'Computer Science', '2026-08-25 10:00:00'),
  (2, 'Mathematics', '2026-08-26 10:00:00'),
  (3, 'Design', '2026-08-27 10:00:00');

INSERT INTO courses (id, title, description, category_id, instructor_id, level, status, created_at, updated_at) VALUES
  (1, 'Introduction to Databases', 'Learn how relational databases store and connect data. You will design tables with primary and foreign keys, write SQL queries, and connect a database to a small web application.', 1, 2, 'Beginner', 'published', '2026-09-05 12:00:00', '2026-11-18 18:00:00'),
  (2, 'Web Development Basics', 'Build a browser interface with HTML, CSS and JavaScript. Covers layout, responsive design and talking to a simple REST API.', 1, 2, 'Beginner', 'published', '2026-09-18 12:00:00', '2026-11-12 18:00:00'),
  (3, 'Advanced SQL Workshop', 'Go beyond basic queries. Read query plans, understand indexes, and rewrite slow queries using subqueries and common table expressions.', 1, 2, 'Intermediate', 'draft', '2026-11-02 12:00:00', '2026-11-20 18:00:00');

INSERT INTO lessons (id, course_id, title, content, duration_min, position, created_at) VALUES
  (1, 1, 'What is a relational database?', 'A relational database stores data in tables and lets you combine those tables with queries. This lesson explains rows, columns and the idea of a relation.', 14, 1, '2026-09-05 12:30:00'),
  (2, 1, 'Tables, rows and columns', 'Every table has a fixed set of columns and any number of rows. We look at naming conventions and data types such as TEXT and INTEGER.', 18, 2, '2026-09-05 12:30:00'),
  (3, 1, 'Primary and foreign keys', 'A primary key identifies a row and a foreign key points at a row in another table. Together they keep facts consistent across tables.', 22, 3, '2026-09-05 12:30:00'),
  (4, 1, 'Writing SELECT queries', 'SELECT is the statement you will use most. This lesson covers choosing columns, sorting with ORDER BY and limiting returned rows.', 20, 4, '2026-09-05 12:30:00'),
  (5, 2, 'How the web works', 'Browsers send HTTP requests and servers return responses. This lesson explains the request-response cycle and what a URL contains.', 15, 1, '2026-09-18 12:30:00'),
  (6, 2, 'HTML structure', 'HTML describes the structure of a page using elements. We cover headings, paragraphs, links, lists and semantic tags.', 20, 2, '2026-09-18 12:30:00'),
  (7, 2, 'Styling with CSS', 'CSS controls how elements look. We cover selectors, the box model, spacing, colour and simple layouts.', 25, 3, '2026-09-18 12:30:00'),
  (8, 3, 'Reading query plans', 'EXPLAIN shows how the database executes a query. We learn to spot full table scans and missing indexes.', 30, 1, '2026-11-02 12:30:00');

INSERT INTO enrollments (id, student_id, course_id, enrolled_at) VALUES
  (1, 3, 1, '2026-10-01 09:00:00'),
  (2, 3, 2, '2026-10-05 09:00:00');

INSERT INTO lesson_completions (id, student_id, lesson_id, completed_at) VALUES
  (1, 3, 1, '2026-10-02 10:00:00'),
  (2, 3, 2, '2026-10-03 10:00:00'),
  (3, 3, 5, '2026-10-06 10:00:00');
