import React, { useState } from "react";
import { Link } from "react-router-dom";

const AboutUs = () => {
	const [email, setEmail] = useState("");
	const [subscribed, setSubscribed] = useState(false);

	const handleSubscribe = e => {
		e.preventDefault();
		if (!email) return;
		setSubscribed(true);
		setEmail("");
		// In real app: send to API or save to DB
	};
	return (
		<div style={{ padding: 40, background: "#fff", minHeight: "80vh" }}>
			<div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 48, alignItems: "center" }}>
				{/* Left column - staggered images/cards (2x2 grid) */}
				<div style={{ flex: 1 }}>
					<div style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gridTemplateRows: "360px 220px",
						gap: 18,
						alignItems: "start"
					}}>
						{/* Left-most: player image - span both rows, centered and slightly enlarged */}
						<div style={{ gridColumn: "1 / 2", gridRow: "1 / 3", borderRadius: 12, overflow: "hidden", boxShadow: "0 18px 40px rgba(0,0,0,0.06)", alignSelf: "center" }}>
							<img src="/Images/Banners/Tienminh.webp" alt="Tuyển thủ" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", objectPosition: "center", transform: "scale(1.12)", transition: "transform .25s ease" }} />
						</div>
						{/* Top-right: stats card */}
						<div style={{ gridColumn: "2 / 3", gridRow: "1 / 2", background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 18px 40px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
							<div style={{ fontWeight: 900, fontSize: 28, color: "#0b57a4" }}>30,000+</div>
							<div style={{ fontSize: 13, color: "#777", marginTop: 8 }}>Lượt đặt sân & sản phẩm bán ra</div>
							<hr style={{ border: 0, height: 1, background: "#06dcfcff", margin: "14px 0" }} />
							<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
								{/* small avatar circles as placeholders */}
								{["A","B","C","D","E","F","G","H"].map((t,i) => (
									<div key={i} style={{ width: 32, height: 32, borderRadius: 16, background: "#0bacf7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>
										{t}
									</div>
								))}
							</div>
						</div>
						{/* Bottom-left: small ratings card */}
						
						{/* Bottom-right: second image */}
						<div style={{ gridColumn: "2 / 3", gridRow: "2 / 3", borderRadius: 12, overflow: "hidden", boxShadow: "0 18px 40px rgba(0,0,0,0.06)" }}>
							<img src="/Images/Banners/poster1.png" alt="Sản phẩm nổi bật" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
						</div>
					</div>
				</div>

				{/* Right column - text */}
				<div style={{ flex: 1, padding: "12px 8px 12px 8px" }}>
					<div style={{ color: "#4aa3e6", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>A BIT</div>
					<h1 style={{ fontSize: 40, margin: "0 0 18px 0", color: "#0b2336" }}>VỀ CHÚNG TÔI</h1>
					<p style={{ color: "#6b7885", lineHeight: 1.8, fontSize: 16 }}>
						Chúng tôi là cửa hàng chuyên cung cấp dụng cụ cầu lông chất lượng cao và nền tảng đặt sân trực tuyến tiện lợi.
						Từ vợt, shuttlecock, giày, tới trang phục thi đấu — mọi thứ dành cho người chơi từ nghiệp dư đến chuyên nghiệp đều có tại cửa hàng.
						Ngoài ra, hệ thống đặt sân của chúng tôi giúp bạn dễ dàng chọn giờ, thanh toán nhanh và quản lý lịch tập luyện nhóm.
					</p>

					<p style={{ color: "#6b7885", lineHeight: 1.6, fontSize: 15 }}>
						Mục tiêu của chúng tôi là hỗ trợ cộng đồng cầu lông phát triển: cung cấp sản phẩm chính hãng, dịch vụ đặt sân linh hoạt và trải nghiệm khách hàng chu đáo. Nếu bạn cần tư vấn chọn vợt hay đặt sân cho đội, đội ngũ chúng tôi luôn sẵn sàng hỗ trợ.
					</p>

					<div style={{ marginTop: 26 }}>
						<Link to="/booking" style={{ textDecoration: "none" }}>
							<button style={{
								background: "linear-gradient(90deg,#5f9bd8,#3da0f0)",
								color: "#fff",
								padding: "12px 22px",
								borderRadius: 10,
								border: "none",
								boxShadow: "0 22px 40px rgba(61,160,240,0.18)",
								fontWeight: 800,
								cursor: "pointer"
							}}>
								KHÁM PHÁ NGAY
							</button>
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AboutUs;
