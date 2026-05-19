import express from "express";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { createServer } from "http";
import { Server } from "socket.io";
import User from "./user.js";
import Inquiry from "./Inquiry.js";
import Profile from "./Profile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/supida";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const logger = morgan("dev");

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB 연결 성공!"))
  .catch((err) => console.log("MongoDB 연결 실패:", err));

app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🔥 [Railway 배포 대응] Express가 외부 프록시(Railway Load Balancer)를 신뢰하도록 설정
app.set('trust proxy', 1);

// 현재 환경이 배포 환경(Production)인지 체크
const isProduction = process.env.NODE_ENV === "production" || !!process.env.PORT;

app.use(session({
    secret: "supida_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URL }),
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24,
        // 🔥 [Railway 배포 대응] 배포 환경(HTTPS)에서는 true, 로컬(HTTP)에서는 false 자동 전환
        secure: isProduction,
        // 🔥 크로스 도메인 및 프록시 환경에서 세션 쿠키 전달을 원활하게 하기 위한 설정
        sameSite: isProduction ? "none" : "lax"
    },
}));

app.get('/api/me', (req, res) => {
    if (req.session.user) {
        res.json({
            loggedIn: true,
            username: req.session.user.username,
            isAdmin: req.session.user.isAdmin || false
        });
    } else {
        res.json({ loggedIn: false });
    }
});

app.use(express.static(join(__dirname)));

app.get('/', (req, res) => res.sendFile(join(__dirname, 'index.html')));
app.get('/login', (req, res) => res.sendFile(join(__dirname, 'login.html')));
app.get('/join', (req, res) => res.sendFile(join(__dirname, 'join.html')));
app.get('/boss', (req, res) => res.sendFile(join(__dirname, 'boss.html')));
app.get('/map', (req, res) => res.sendFile(join(__dirname, 'map.html')));
app.get('/menu1', (req, res) => res.sendFile(join(__dirname, 'menu1.html')));
app.get('/menu2', (req, res) => res.sendFile(join(__dirname, 'menu2.html')));
app.get('/menu3', (req, res) => res.sendFile(join(__dirname, 'menu3.html')));
app.get('/menu4', (req, res) => res.sendFile(join(__dirname, 'menu4.html')));
app.get('/FAQ', (req, res) => res.sendFile(join(__dirname, 'FAQ.html')));
app.get('/qna', (req, res) => res.sendFile(join(__dirname, 'qna.html')));
app.get('/q', (req, res) => res.sendFile(join(__dirname, 'q.html')));
app.get('/qna/:id', (req, res) => res.sendFile(join(__dirname, 'qna_detail.html')));

app.get('/admin', (req, res) => {
    if (!req.session.user?.isAdmin) return res.redirect('/');
    res.sendFile(join(__dirname, 'admin.html'));
});
app.get('/admin/chat', (req, res) => {
    if (!req.session.user?.isAdmin) return res.redirect('/');
    res.sendFile(join(__dirname, 'admin_chat.html'));
});

app.get('/api/qna', async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        res.json(inquiries);
    } catch (err) {
        res.status(500).json({ error: "오류 발생" });
    }
});

app.post('/api/qna', async (req, res) => {
    try {
        const { name, title, content, secret, password } = req.body;
        const hash = (secret === 'y' && password) ? await bcrypt.hash(password, 10) : null;
        const inquiry = await Inquiry.create({ name, title, content, secret: secret === 'y', password: hash });
        res.json({ ok: true, id: inquiry._id });
    } catch (err) {
        res.status(500).json({ ok: false });
    }
});

app.get('/api/qna/:id', async (req, res) => {
    try {
        const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
        res.json(inquiry);
    } catch (err) {
        res.status(404).json({ error: "없음" });
    }
});

app.post('/api/qna/:id/answer', async (req, res) => {
    if (!req.session.user?.isAdmin) return res.status(403).json({ error: "권한 없음" });
    const { answer } = req.body;
    await Inquiry.findByIdAndUpdate(req.params.id, { answer, answeredAt: new Date() });
    res.json({ ok: true });
});

app.post('/join', async (req, res) => {
    try {
        const { username, password } = req.body;
        const exists = await User.findOne({ username });
        if (exists) return res.send("이미 존재하는 아이디예요!");
        const hash = await bcrypt.hash(password, 10);
        await User.create({ username, password: hash });
        res.redirect('/login');
    } catch (err) {
        res.send("회원가입 중 오류가 발생했어요");
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.send("존재하지 않는 아이디예요");
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.send("비밀번호가 틀렸어요");
        
        console.log("로그인 유저:", user.username, "isAdmin:", user.isAdmin);
        
        req.session.user = {
            id: user._id,
            username: user.username,
            isAdmin: user.isAdmin || false
        };
        
        // 🔥 [타이밍 이슈 해결] 세션이 DB(MongoStore)에 완전히 저장된 후 리다이렉트 처리
        req.session.save((err) => {
            if (err) {
                console.error("세션 저장 오류:", err);
                return res.send("로그인 처리 중 오류가 발생했습니다.");
            }
            console.log("세션 저장 완료:", req.session.user);
            res.redirect('/');
        });
    } catch (err) {
        res.send("로그인 중 오류가 발생했어요");
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

import Profile from "./Profile.js";

// 프로필 페이지
app.get('/profile', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(join(__dirname, 'profile.html'));
});

// 프로필 조회
app.get('/api/profile', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
    try {
        const profile = await Profile.findOne({ userId: req.session.user.id });
        res.json(profile || {});
    } catch (err) {
        res.status(500).json({ error: "오류 발생" });
    }
});

// 프로필 저장/수정
app.post('/api/profile', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "로그인 필요" });
    try {
        const { name, age, phone, address, email, memo } = req.body;
        await Profile.findOneAndUpdate(
            { userId: req.session.user.id },
            { name, age, phone, address, email, memo, username: req.session.user.username, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false });
    }
});

// 관리자 - 전체 프로필 목록
app.get('/api/admin/profiles', async (req, res) => {
    if (!req.session.user?.isAdmin) return res.status(403).json({ error: "권한 없음" });
    try {
        const profiles = await Profile.find().sort({ updatedAt: -1 });
        res.json(profiles);
    } catch (err) {
        res.status(500).json({ error: "오류 발생" });
    }
});

// 관리자 - 프로필 삭제
app.delete('/api/admin/profiles/:id', async (req, res) => {
    if (!req.session.user?.isAdmin) return res.status(403).json({ error: "권한 없음" });
    try {
        await Profile.findByIdAndDelete(req.params.id);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false });
    }
});

// 관리자 - 프로필 수정
app.put('/api/admin/profiles/:id', async (req, res) => {
    if (!req.session.user?.isAdmin) return res.status(403).json({ error: "권한 없음" });
    try {
        const { name, age, phone, address, email, memo } = req.body;
        await Profile.findByIdAndUpdate(req.params.id, { name, age, phone, address, email, memo, updatedAt: new Date() });
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false });
    }
});

app.get('/admin/users', (req, res) => {
    if (!req.session.user?.isAdmin) return res.redirect('/');
    res.sendFile(join(__dirname, 'admin_users.html'));
});

const publicChatHistory = [];
const privateRooms = {};
const onlineUsers = {};

io.on('connection', (socket) => {
    socket.on('joinPublic', (username) => {
        onlineUsers[socket.id] = username;
        socket.join('public');
        socket.emit('history', publicChatHistory);
        io.to('public').emit('userList', Object.values(onlineUsers));
    });

    socket.on('publicMessage', (msg) => {
        const data = { name: msg.name || '익명', text: msg.text, time: new Date().toLocaleTimeString('ko-KR') };
        publicChatHistory.push(data);
        if (publicChatHistory.length > 100) publicChatHistory.shift();
        io.to('public').emit('publicMessage', data);
    });

    socket.on('joinPrivate', ({ username, roomId }) => {
        socket.join(roomId);
        if (!privateRooms[roomId]) privateRooms[roomId] = [];
        socket.emit('privateHistory', privateRooms[roomId]);
    });

    socket.on('privateMessage', ({ roomId, name, text }) => {
        const data = { name, text, time: new Date().toLocaleTimeString('ko-KR') };
        if (!privateRooms[roomId]) privateRooms[roomId] = [];
        privateRooms[roomId].push(data);
        io.to(roomId).emit('privateMessage', data);
        io.to('admin').emit('newPrivateMessage', { roomId, ...data });
    });

    socket.on('joinAdmin', () => {
        socket.join('admin');
        socket.emit('roomList', Object.keys(privateRooms));
    });

    socket.on('disconnect', () => {
        delete onlineUsers[socket.id];
        io.to('public').emit('userList', Object.values(onlineUsers));
    });
});

httpServer.listen(PORT, () => console.log(`server listening on http://localhost:${PORT}`));
console.log("MONGO_URL:", process.env.MONGO_URL);