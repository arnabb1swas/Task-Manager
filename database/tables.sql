CREATE TABLE
    public."user" (
        id SERIAL PRIMARY KEY NOT NULL,
        name text NOT NULL,
        email text UNIQUE NOT NULL,
        password text NOT NULL,
        "createdAt" timestamp WITHOUT TIME ZONE DEFAULT CLOCK_TIMESTAMP(),
        "updatedAt" timestamp WITHOUT TIME ZONE DEFAULT CLOCK_TIMESTAMP()
    );

CREATE TABLE
    public."task" (
        id SERIAL PRIMARY KEY NOT NULL,
        title text NOT NULL,
        status boolean DEFAULT FALSE,
        fk_user_id integer NOT NULL,
        "createdAt" timestamp WITHOUT TIME ZONE DEFAULT CLOCK_TIMESTAMP(),
        "updatedAt" timestamp WITHOUT TIME ZONE DEFAULT CLOCK_TIMESTAMP(),
        CONSTRAINT fk_task_user_id FOREIGN KEY (fk_user_id) REFERENCES PUBLIC."user" (id) ON DELETE CASCADE
    );

CREATE TABLE
    public."map_task_tasks" (
        id SERIAL PRIMARY KEY NOT NULL,
        fk_parent_task_id integer NOT NULL,
        fk_sub_task_id integer NOT NULL,
        CONSTRAINT fk_task_map_task_id FOREIGN KEY (fk_parent_task_id) REFERENCES PUBLIC."task" (id) ON DELETE CASCADE
    );