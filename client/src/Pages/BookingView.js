import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Thêm dòng này

const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];


function getCurrentWeekDates(startDate = new Date()) {
  const monday = new Date(startDate);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function Booking() {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]); // [{dayIdx, timeIdx}]
  const [weekStart, setWeekStart] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState([]); // [{date, timeSlot}]
  const [timeSlots, setTimeSlots] = useState([]); // <-- Thêm state động cho timeSlots
  const weekDates = getCurrentWeekDates(weekStart);
  const navigate = useNavigate(); // Thêm dòng này
  const [today, setToday] = useState(new Date());
  const [bookingMode, setBookingMode] = useState('single'); // 'single' hoặc 'recurring'
  const [recurringWeeks, setRecurringWeeks] = useState(4); // Số tuần lặp lại (mặc định 1 tháng = 4 tuần)

  // Lấy danh sách chi nhánh khi load trang
  useEffect(() => {
    fetch("http://localhost:3000/branches")
      .then(res => res.json())
      .then(data => {
        setBranches(data);
        if (data.length > 0) setSelectedBranch(data[0].BranchId);
      })
      .catch(() => setBranches([]));
  }, []);

  // Lấy danh sách khung giờ khi load trang
  useEffect(() => {
    fetch("http://localhost:3000/timeslots")
      .then(res => res.json())
      .then(data => setTimeSlots(data))
      .catch(() => setTimeSlots([]));
  }, []);

  // Lấy danh sách sân khi chọn chi nhánh
  useEffect(() => {
    if (selectedBranch) {
      fetch(`http://localhost:3000/courts?branchId=${selectedBranch}`)
        .then(res => res.json())
        .then(data => {
          setCourts(data);
          // Nếu có sân, mặc định chọn sân đầu tiên
          if (data.length > 0) setSelectedCourt(data[0].CourtId);
          else setSelectedCourt(null);
        })
        .catch(() => {
          setCourts([]);
          setSelectedCourt(null);
        });
    } else {
      setCourts([]);
      setSelectedCourt(null);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (!selectedCourt || !selectedBranch) {
      setBookedSlots([]);
      return;
    }
    const weekStartStr = weekDates[0].toISOString().slice(0, 10);
    const weekEndStr = weekDates[6].toISOString().slice(0, 10);
    fetch(
      `http://localhost:3000/booked-slots?branchId=${selectedBranch}&courtId=${selectedCourt}&weekStart=${weekStartStr}&weekEnd=${weekEndStr}`
    )
      .then(res => res.json())
      .then(data => setBookedSlots(data))
      .catch(() => setBookedSlots([]));
  }, [selectedBranch, selectedCourt, weekStart]);

  // Chọn/huỷ chọn khung giờ - Logic mới: cho phép chọn tự do nhiều ngày
  const toggleSlot = (dayIdx, timeIdx) => {
    // Kiểm tra ngày có phải quá khứ không
    const slotDate = new Date(weekDates[dayIdx]);
    const now = new Date();
    const todayDate = new Date();
    slotDate.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);
    
    if (slotDate < todayDate) {
      alert("Không thể đặt sân cho ngày trong quá khứ!");
      return;
    }
    
    // Nếu là hôm nay, kiểm tra thời gian
    if (slotDate.getTime() === todayDate.getTime()) {
      const currentHour = now.getHours();
      const slotStartTime = timeSlots[timeIdx]?.StartTime;
      if (slotStartTime) {
        const slotStartHour = parseInt(slotStartTime.split(":")[0], 10);
        if (slotStartHour <= currentHour) {
          alert(`Không thể đặt khung giờ đã qua! Hiện tại là ${currentHour}h, không thể đặt lúc ${slotStartHour}h.`);
          return;
        }
      }
    }
    
    const key = `${dayIdx}-${timeIdx}`;
    setSelectedSlots(slots => {
      // Nếu đã chọn thì bỏ chọn
      if (slots.some(s => s.key === key)) {
        return slots.filter(s => s.key !== key);
      } else {
        // Kiểm tra giới hạn tối đa
        const maxSlots = bookingMode === 'recurring' ? 50 : 20; // Cho phép nhiều hơn khi đặt định kỳ
        if (slots.length >= maxSlots) {
          alert(`Bạn chỉ được đặt tối đa ${maxSlots} khung giờ mỗi lần!`);
          return slots;
        }
        // Cho phép chọn tự do bất kỳ khung giờ nào
        return [...slots, { key, dayIdx, timeIdx }];
      }
    });
  };
  const handleCourtSelect = (courtId) => setSelectedCourt(courtId);

  // Đổi tuần
  const changeWeek = (offset) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + offset * 7);
    setWeekStart(newStart);
    setSelectedSlots([]); // reset chọn khi đổi tuần
  };

  // Update `today` so the "Hôm nay" badge moves correctly when date changes
  useEffect(() => {
    const tick = () => setToday(new Date());
    const id = setInterval(tick, 60 * 1000); // cập nhật mỗi phút
    return () => clearInterval(id);
  }, []);

  const handleBooking = () => {
    if (!selectedCourt || selectedSlots.length === 0) {
      alert("Vui lòng chọn sân và ít nhất một khung giờ!");
      return;
    }
    
    let bookingSlots = [];
    
    if (bookingMode === 'single') {
      // Chế độ đặt thường - chỉ đặt cho tuần hiện tại
      bookingSlots = selectedSlots.map(({ dayIdx, timeIdx }) => ({
        branchId: selectedBranch,
        courtId: selectedCourt,
        courtName: courts.find(c => c.CourtId === selectedCourt)?.CourtName,
        bookingDate: weekDates[dayIdx].toISOString().slice(0, 10),
        timeSlotId: timeSlots[timeIdx]?.TimeSlotId,
        timeSlotLabel: timeSlots[timeIdx]
          ? `${parseInt(timeSlots[timeIdx].StartTime.split(":")[0], 10)}-${parseInt(timeSlots[timeIdx].EndTime.split(":")[0], 10)}`
          : ""
      }));
    } else {
      // Chế độ đặt định kỳ - lặp lại cho nhiều tuần
      for (let week = 0; week < recurringWeeks; week++) {
        selectedSlots.forEach(({ dayIdx, timeIdx }) => {
          const targetDate = new Date(weekDates[dayIdx]);
          targetDate.setDate(targetDate.getDate() + (week * 7));
          
          bookingSlots.push({
            branchId: selectedBranch,
            courtId: selectedCourt,
            courtName: courts.find(c => c.CourtId === selectedCourt)?.CourtName,
            bookingDate: targetDate.toISOString().slice(0, 10),
            timeSlotId: timeSlots[timeIdx]?.TimeSlotId,
            timeSlotLabel: timeSlots[timeIdx]
              ? `${parseInt(timeSlots[timeIdx].StartTime.split(":")[0], 10)}-${parseInt(timeSlots[timeIdx].EndTime.split(":")[0], 10)}`
              : "",
            isRecurring: true,
            weekNumber: week + 1
          });
        });
      }
    }
    
    navigate("/bookingcheckout", { state: { bookingSlots, bookingMode, recurringWeeks } });
  };

  return (
    <div className="booking-container">
      <h2 className="booking-title">Đặt và chọn địa chỉ sân</h2>
      
      {/* Chọn chế độ đặt lịch */}
      <div style={{ marginBottom: 20, padding: '15px', background: '#f8f9fa', borderRadius: 8 }}>
        <h3 style={{ marginBottom: 15, fontSize: 16, fontWeight: 600 }}>Chế độ đặt lịch:</h3>
        <div style={{ display: 'flex', gap: 20, marginBottom: 15 }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              name="bookingMode"
              value="single"
              checked={bookingMode === 'single'}
              onChange={(e) => setBookingMode(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <span>Đặt lịch thường (một lần)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="radio"
              name="bookingMode"
              value="recurring"
              checked={bookingMode === 'recurring'}
              onChange={(e) => setBookingMode(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <span>Đặt lịch cố định (lặp lại hàng tuần)</span>
          </label>
        </div>
        
        {bookingMode === 'recurring' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontWeight: 500 }}>Số tuần lặp lại:</label>
            <select
              value={recurringWeeks}
              onChange={(e) => setRecurringWeeks(parseInt(e.target.value))}
              style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #ccc' }}
            >
              <option value="4">1 tháng (4 tuần)</option>
              <option value="8">2 tháng (8 tuần)</option>
              <option value="12">3 tháng (12 tuần)</option>
              <option value="16">4 tháng (16 tuần)</option>
            </select>
            <span style={{ fontSize: 13, color: '#666', marginLeft: 10 }}>
              Lịch đã chọn sẽ được lặp lại trong {recurringWeeks} tuần
            </span>
          </div>
        )}
      </div>
      
      <div className="booking-branches">
        {branches.map(b => (
          <button
            key={b.BranchId}
            type="button"
            className={selectedBranch === b.BranchId ? "branch-btn selected" : "branch-btn"}
            onClick={() => setSelectedBranch(b.BranchId)}
            style={{
              marginRight: 16,
              padding: "8px 18px",
              borderRadius: 6,
              border: selectedBranch === b.BranchId ? "2px solid #007bff" : "1px solid #2c5673",
              background: selectedBranch === b.BranchId ? "#eaf6fb" : "#f5faff",
              color: selectedBranch === b.BranchId ? "#007bff" : "#2c5673",
              fontWeight: selectedBranch === b.BranchId ? "bold" : "normal",
              cursor: "pointer",
              outline: "none"
            }}
          >
            {b.BranchName}
          </button>
        ))}
      </div>
      <div className="booking-courts">
        {courts.map(court => (
          <div
            key={court.CourtId}
            className={`booking-court${selectedCourt === court.CourtId ? " selected" : ""}`}
            onClick={() => handleCourtSelect(court.CourtId)}
          >
            <span className="court-number">{court.CourtName}</span>
          </div>
        ))}
      </div>
      <div className="booking-week">
        <button onClick={() => changeWeek(-1)}>Tuần trước</button>
        <span>
          Tuần: {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
        </span>
        <button onClick={() => changeWeek(1)}>Tuần sau</button>
      </div>
      <table className="booking-table">
        <thead>
          <tr>
            {days.map((d, i) => {
              const cellDateStr = weekDates[i].toISOString().slice(0,10);
              const todayStr = today.toISOString().slice(0,10);
              const isToday = cellDateStr === todayStr;
                  return ( 
                    <th key={i} style={{ position: "relative", padding: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, justifyContent: "center" }}>
                          {isToday && (
                            <div title="Hôm nay" aria-label="Hôm nay" style={{ background: "#e0f2fe", padding: 6, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                              <span role="img" aria-hidden="false">🎯</span>
                            </div>
                          )}
                          <div style={{ fontWeight: 700, marginTop: 4 }}>{d}</div>
                          <div style={{ fontSize: 12, color: "#555" }}>{weekDates[i].toLocaleDateString()}</div>
                        </div>
                    </th>
                  ); 
            })}
          </tr>
        </thead>
        <tbody>
          {timeSlots
            .slice()
            .sort((a, b) => {
              const aHour = parseInt(a.StartTime.split(":")[0], 10);
              const bHour = parseInt(b.StartTime.split(":")[0], 10);
              return aHour - bHour;
            })
            .map((slot, timeIdx) => {
              const startHour = parseInt(slot.StartTime.split(":")[0], 10);
              const endHour = parseInt(slot.EndTime.split(":")[0], 10);
              return (
                <tr key={slot.TimeSlotId}>
                  {days.map((_, dayIdx) => {
                    const key = `${dayIdx}-${timeIdx}`;
                    const slotDate = weekDates[dayIdx].toISOString().slice(0, 10);
                    
                    // Kiểm tra ngày quá khứ
                    const cellDate = new Date(weekDates[dayIdx]);
                    const now = new Date();
                    const todayDate = new Date();
                    cellDate.setHours(0, 0, 0, 0);
                    todayDate.setHours(0, 0, 0, 0);
                    const isPastDate = cellDate < todayDate;
                    
                    // Kiểm tra giờ đã qua trong ngày hôm nay
                    const isToday = cellDate.getTime() === todayDate.getTime();
                    const currentHour = now.getHours();
                    const slotStartHour = parseInt(slot.StartTime.split(":")[0], 10);
                    const isPastTime = isToday && slotStartHour <= currentHour;
                    
                    const isBooked = bookedSlots.some(
                      b =>
                        b.CourtId === selectedCourt &&
                        b.BookingDate === slotDate &&
                        b.TimeSlotId === slot.TimeSlotId
                    );
                    const selected = selectedSlots.some(s => s.key === key);
                    const isDisabled = isBooked || isPastDate || isPastTime;
                    
                    return (
                      <td
                        key={key}
                        className={
                          isBooked
                            ? "booked"
                            : isPastDate || isPastTime
                            ? "past-date"
                            : selected
                            ? "selected"
                            : ""
                        }
                        style={{
                          background: isBooked
                            ? "#ccc"
                            : isPastDate || isPastTime
                            ? "#f5f5f5"
                            : selected
                            ? "linear-gradient(20deg, #5f9bd8 0%, #d9dde2 100%)"
                            : "#fff",
                          color: isDisabled ? "#999" : undefined,
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          opacity: isPastDate || isPastTime ? 0.5 : 1,
                          textDecoration: isPastDate || isPastTime ? "line-through" : "none"
                        }}
                        onClick={() => {
                          if (!isDisabled) toggleSlot(dayIdx, timeIdx);
                        }}
                        title={
                          isPastTime 
                            ? `Giờ đã qua (hiện tại ${currentHour}h)` 
                            : isPastDate 
                            ? "Không thể đặt ngày quá khứ" 
                            : isBooked 
                            ? "Đã được đặt" 
                            : "Nhấn để chọn"
                        }
                      >
                        {`${startHour}-${endHour}`}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
        </tbody>
      </table>
      {/* Hiển thị tổng số slots đã chọn */}
      {selectedSlots.length > 0 && (
        <div style={{ marginTop: 20, padding: '15px', background: '#e7f3ff', borderRadius: 8, border: '1px solid #2196f3' }}>
          <h4 style={{ marginBottom: 10, color: '#1976d2' }}>Thông tin đặt lịch:</h4>
          <p style={{ marginBottom: 5 }}>
            <strong>Số khung giờ đã chọn:</strong> {selectedSlots.length} khung giờ
          </p>
          {bookingMode === 'recurring' && (
            <>
              <p style={{ marginBottom: 5 }}>
                <strong>Chế độ:</strong> Đặt lịch cố định {recurringWeeks} tuần
              </p>
              <p style={{ marginBottom: 5, color: '#d32f2f', fontWeight: 600 }}>
                <strong>Tổng cộng:</strong> {selectedSlots.length * recurringWeeks} khung giờ 
                (lặp lại {selectedSlots.length} khung/tuần × {recurringWeeks} tuần)
              </p>
            </>
          )}
          <p style={{ fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 10 }}>
            💡 Mẹo: Bạn có thể chọn tự do các khung giờ trên nhiều ngày khác nhau
          </p>
        </div>
      )}
      
      <div className="booking-confirm">
        <button onClick={handleBooking}>
          {bookingMode === 'recurring' 
            ? `Xác nhận đặt ${selectedSlots.length * recurringWeeks} khung giờ` 
            : 'Xác nhận đặt sân'}
        </button>
      </div>
    </div>
  );
}

export default Booking;