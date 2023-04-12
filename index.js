import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { JWT_KEY, USERS } from "./data.js";

const app = express();
app.use(cors());
app.use(express.json());

// Gelen tüm isteklerin HTTP metodunu ve adresini konsola yazdır
app.use((req, res, next) => {
	const now = new Date();
	console.log(`[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}] ${req.method} ${req.url}`);
	return next();
});

app.post("/register", (req, res) => {
	const { email, password } = req.body;

	const emailExists = USERS.find((u) => u.email === email);
	if (emailExists) {
		return res.json({
			ok: false,
			message: "Bu e-postayla kayıtlı bir hesap mevcut. Lütfen başka bir e-posta girin."
		});
	}

	const newUser = {
		email: email,
		password: password
	};
	USERS.push(newUser);

	return res.json({
		ok: true,
		message: "Başarıyla kayıt yapıldı. Yeni hesabınızla giriş yapabilirsiniz.",
	});
});

app.post("/login", (req, res) => {
	const { email, password } = req.body;

	const user = USERS.find((u) => u.email === email && u.password === password);
	if (!user) {
		return res.json({
			ok: false,
			message: "Girilen e-posta veya şifre yanlış."
		});
	}

	const token = jwt.sign(
		{ userEmail: user.email }, // Token içinde sakladığımız data
		JWT_KEY,                   // Tokenin güvenliğini sağlamak için sunucuda gizli tuttuğumuz şifre
		{ expiresIn: "1h" }        // Token ayarları (Oluşturulduktan 1 saat sonra geçersiz olsun)
	);

	return res.json({
		ok: true,
		message: "Başarıyla giriş yapıldı.",
		data: {
			token: token
		}
	});
});

app.get("/publicContent", (req, res) => {
	return res.json({
		ok: true,
		message: "Bu içeriği herkes görebilir. Giriş yapma şartı yok."
	});
});

app.get("/privateContent", (req, res) => {
	// İsteğe Authorization header'ında token eklendiğini ve tokenin geçerli olduğunu kontrol et
	let tokenData;
	try {
		const token = req.headers["authorization"].split(" ")[1];
		tokenData = jwt.verify(token, JWT_KEY);
	} catch (error) {
		return res.json({
			ok: false,
			message: "Önce giriş yapmanız gerekiyor."
		});
	}

	return res.json({
		ok: true,
		message: `Bu içeriği sadece giriş yapanlar görebilir. Şu anda ${tokenData.userEmail} olarak giriş yapmışsınız.`
	});
});

const PORT = 5005;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
