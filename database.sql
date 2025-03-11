CREATE DATABASE smserver;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users(
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    user_createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users(user_name, user_email, user_password) VALUES ('long', 'longnguyen@gmail.com', 'password123');
-----------------------------------------------------------
CREATE TABLE projects(
    project_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    project_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    project_createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

INSERT INTO projects (user_id, project_name, project_status)
VALUES ((SELECT user_id FROM users WHERE user_email = 'longnguyen@gmail.com'), 'AI Code Optimizer', 'pending');
-----------------------------------------------------------
CREATE TABLE folders(
    folder_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    folder_path_input TEXT NOT NULL,
    folder_path_output TEXT,
    folder_createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

INSERT INTO folders (project_id, folder_path_input, folder_path_output)
VALUES
    ((SELECT project_id FROM projects WHERE project_name = 'AI Code Optimizer'),
        '/minio/uploads/long/project1/', NULL);
-----------------------------------------------------------
CREATE TABLE metrics(
    metric_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid NOT NULL,
    metric_type VARCHAR(255) NOT NULL, -- Example: "execution_time_chart"
    metric_path TEXT NOT NULL,
    metric_createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

INSERT INTO metrics (project_id, metric_type, metric_path)
VALUES
    ((SELECT project_id FROM projects WHERE project_name = 'AI Code Optimizer'),
        'execution_time_chart',
        '/minio/uploads/john/project1/execution_time.png'
    );
