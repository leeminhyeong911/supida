import express from "express";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/supida";
const app = express();
const logger = morgan("dev");

// MongoDB 연결
mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB 연결 성공!"))
  .catch((err) => console.log("MongoDB 연결 실패:", err));

app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 세션 설정
app.use(session({
    secret: "supida_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URL }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24시간
}));

app.get('/api/me', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, username: req.session.user.username });
    } else {
        res.json({ loggedIn: false });
    }
});

app.use(express.static(join(__dirname)));

// 페이지 라우터
app.get('/', (req, res) => res.sendFile(join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(join(__dirname, 'login.html')));
app.get('/join', (req, res) => res.sendFile(join(__dirname, 'join.html')));
app.get('/boss', (req, res) => res.sendFile(join(__dirname, 'boss.html')));
app.get('/map', (req, res) => res.sendFile(join(__dirname, 'map.html')));
app.get('/menu1', (req, res) => res.sendFile(join(__dirname, 'menu1.html')));
app.get('/menu2', (req, res) => res.sendFile(join(__dirname, 'menu2.html')));
app.get('/menu3', (req, res) => res.sendFile(join(__dirname, 'menu3.html')));
app.get('/menu4', (req, res) => res.sendFile(join(__dirname, 'menu4.html')));
app.get('/예초', (req, res) => res.sendFile(join(__dirname, '1예초.html')));
app.get('/fqa', (req, res) => res.sendFile(join(__dirname, 'FQA.html')));
app.get('/문의', (req, res) => res.sendFile(join(__dirname, '문의.html')));
app.get('/login', (req, res) => res.sendFile(join(__dirname, 'login.html')));
app.get('/q', (req, res) => res.sendFile(join(__dirname, 'q.html')));

// 회원가입
app.post('/join', async (req, res) => {
    try {
        const { username, password } = req.body;
        const exists = await User.findOne({ username });
        if (exists) return res.send("이미 존재하는 아이디예요!");
        const hash = await bcrypt.hash(password, 10);
        await User.create({ username, password: hash });
        res.redirect('/login');
    } catch (err) {
        console.log(err);
        res.send("회원가입 중 오류가 발생했어요");
    }
});

// 로그인
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.send("존재하지 않는 아이디예요");
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.send("비밀번호가 틀렸어요");
        req.session.user = { id: user._id, username: user.username };
        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.send("로그인 중 오류가 발생했어요");
    }
});

app.get('/join', (req, res) => {
    res.sendFile(join(__dirname, 'join.html'));
});

// 로그아웃
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const handleListening = () =>
    console.log(`server listening on port http://localhost:${PORT}`);

app.listen(PORT, handleListening);