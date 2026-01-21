import pkg from "mongoose"
const {Schema, model} = pkg

const commentSchema = Schema({
    authorId: { type: String, required: true },
    authorName: String,
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const ratingSchema = Schema({
    authorId: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    date: { type: Date, default: Date.now }
});

const lessonSchema = Schema({
    courseId: { type: String, required: true },
    subject: { type: String, required: true }, 
    title: { type: String, required: true },
    description: String,
    videoUrl: String,
    duration: Number, // em minutos
    order: { type: Number, required: true },
    professor: String,
    resources: [{
        type: { type: String, enum: ['pdf', 'ppt', 'doc', 'link', 'quiz', 'video'] },
        title: String,
        url: String,
        description: String
    }],
    comments: [commentSchema],
    ratings: [ratingSchema],
    createdAt: { type: Date, default: Date.now }
});

const courseSchema = Schema({
    courseId: { type: String, required: true, unique: true }, // ps1, ps2, ps3, enem
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ['psc', 'sis', 'enem'], required: true },
    professors: [String],
    totalLessons: { type: Number, default: 0 },
    totalHours: Number,
    rating: { type: Number, default: 0 },
    enrolledStudents: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const userProgressSchema = Schema({
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    completedLessons: [{ type: String }], // IDs das aulas concluídas
    lastAccessed: Date,
    totalTime: { type: Number, default: 0 }, // tempo total em minutos
    streak: { type: Number, default: 0 }, // dias consecutivos
    createdAt: { type: Date, default: Date.now }
});

const Course = model('Course', courseSchema);
const Lesson = model('Lesson', lessonSchema);
const UserProgress = model('UserProgress', userProgressSchema);

export { Course, Lesson, UserProgress };