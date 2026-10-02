INSERT INTO tuition_packages (code, name, description, price_vnd, duration_days, status)
VALUES
    ('STARTER-30', 'Starter Package', 'Foundation package for new TOEIC learners.', 499000, 30, 'ACTIVE'),
    ('TOEIC-600-90', 'TOEIC 600+ Package', 'A structured ninety-day TOEIC preparation package.', 1499000, 90, 'ACTIVE');

INSERT INTO courses (code, title, description, level, price_vnd, package_id, status)
VALUES
    ('TOEIC-STARTER', 'TOEIC Starter', 'English foundations and an introduction to the TOEIC test.', 'STARTER', 499000,
        (SELECT id FROM tuition_packages WHERE code = 'STARTER-30'), 'PUBLISHED'),
    ('TOEIC-600', 'TOEIC 600+ Roadmap', 'Vocabulary, grammar, listening, and reading practice for a 600+ target.', 'INTERMEDIATE_B1', 1499000,
        (SELECT id FROM tuition_packages WHERE code = 'TOEIC-600-90'), 'PUBLISHED');

