-- CreateTable
CREATE TABLE "Candidate_Profile" (
    "id" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date_of_birth" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "preferred_salary" DOUBLE PRECISION,
    "about" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Candidate_Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "postal_code" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "pic" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "graduation_date" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "institute_name" TEXT NOT NULL,
    "institute_address" TEXT NOT NULL,
    "study_field" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "min_monthly_salary" DOUBLE PRECISION NOT NULL,
    "max_monthly_salary" DOUBLE PRECISION NOT NULL,
    "candidate_nationality" TEXT NOT NULL,
    "candidate_min_edu_level" TEXT NOT NULL,
    "candidate_min_of_exp" TEXT NOT NULL,
    "candidate_lang_req" TEXT NOT NULL,
    "candidate_other_req" TEXT,
    "job_responsibilities" TEXT NOT NULL,
    "other_info" TEXT,
    "created_date" TEXT NOT NULL,
    "last_modified_date" TEXT NOT NULL,
    "recruitment_status" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "job_field" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lang_Ability" (
    "id" TEXT NOT NULL,
    "language_name" TEXT NOT NULL,
    "scale_of_writing" TEXT NOT NULL,
    "scale_of_speaking" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,

    CONSTRAINT "Lang_Ability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL,
    "created_date" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "is_resigned" BOOLEAN NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT,

    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shortlisted_Candidate" (
    "id" TEXT NOT NULL,
    "notes" TEXT,
    "is_qualified_interview" BOOLEAN NOT NULL,
    "interview_datetime" TEXT,
    "interview_platform" TEXT,
    "shortlisted_date" TEXT,
    "interviewlisted_date" TEXT,
    "candidate_profile_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,

    CONSTRAINT "Shortlisted_Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "skill_name" TEXT NOT NULL,
    "proficiency" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "notes" TEXT,
    "is_only_wish" BOOLEAN NOT NULL,
    "is_viewed" BOOLEAN NOT NULL,
    "applied_date" TEXT,
    "candidate_profile_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Successful_Candidate" (
    "id" TEXT NOT NULL,
    "notes" TEXT,
    "monthly_salary" DOUBLE PRECISION NOT NULL,
    "confirmation_status" TEXT NOT NULL,
    "added_date" TEXT,
    "candidate_profile_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,

    CONSTRAINT "Successful_Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work_Experience" (
    "id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_address" TEXT NOT NULL,
    "monthly_salary" DOUBLE PRECISION NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,

    CONSTRAINT "Work_Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "pic" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_Profile_user_id_key" ON "Candidate_Profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Company_website_key" ON "Company"("website");

-- CreateIndex
CREATE UNIQUE INDEX "Officer_user_id_key" ON "Officer"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Candidate_Profile" ADD CONSTRAINT "Candidate_Profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "Candidate_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lang_Ability" ADD CONSTRAINT "Lang_Ability_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "Candidate_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Officer" ADD CONSTRAINT "Officer_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "Candidate_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlisted_Candidate" ADD CONSTRAINT "Shortlisted_Candidate_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "Candidate_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlisted_Candidate" ADD CONSTRAINT "Shortlisted_Candidate_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "Candidate_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "Candidate_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Successful_Candidate" ADD CONSTRAINT "Successful_Candidate_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "Candidate_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Successful_Candidate" ADD CONSTRAINT "Successful_Candidate_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work_Experience" ADD CONSTRAINT "Work_Experience_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "Candidate_Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
