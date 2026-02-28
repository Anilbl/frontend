import React, { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import api from "../../../api/axios";
import "react-calendar/dist/Calendar.css";
import "./HolidaySettings.css";

// Standard SVG Icons as constants
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const HolidaySettings = () => {
    const today = new Date();
    const [holidays, setHolidays] = useState([]);
    const [viewDate, setViewDate] = useState(today);
    const [loading, setLoading] = useState(false);
    
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;
    const [isRangeMode, setIsRangeMode] = useState(false);
    const [rangeStart, setRangeStart] = useState(null);

    // --- MODAL STATE ---
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        type: "input", 
        value: "",
        onConfirm: () => {},
        confirmLabel: "Okay"
    });

    const closeHeaderModal = () => setModalConfig({ ...modalConfig, isOpen: false, value: "" });

    const fetchSavedHolidays = useCallback(async (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const start = `${year}-${month.toString().padStart(2, "0")}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const end = `${year}-${month.toString().padStart(2, "0")}-${lastDay}`;

        try {
            setLoading(true);
            // Matches Controller @GetMapping: /api/holidays
            const res = await api.get(`/holidays`, { params: { start, end } });
            const sortedData = res.data.sort((a, b) => new Date(a.holidayDate) - new Date(b.holidayDate));
            setHolidays(sortedData);
            setCurrentPage(1); 
        } catch (err) { 
            console.error("Fetch error:", err); 
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSavedHolidays(viewDate);
    }, [viewDate, fetchSavedHolidays]);

    const handleDelete = (id) => {
        setModalConfig({
            isOpen: true,
            title: "Delete Holiday",
            type: "confirm",
            value: "Are you sure you want to delete this record?",
            confirmLabel: "Delete",
            onConfirm: async () => {
                try {
                    await api.delete(`/holidays/${id}`);
                    fetchSavedHolidays(viewDate);
                    closeHeaderModal();
                } catch (err) { alert("Delete failed."); }
            }
        });
    };

    const handleEdit = (holiday) => {
        setModalConfig({
            isOpen: true,
            title: "Update Holiday Name",
            type: "input",
            value: holiday.holidayName,
            confirmLabel: "Update",
            onConfirm: async (newName) => {
                if (newName && newName !== holiday.holidayName) {
                    try {
                        // Backend Entity uses holidayName
                        await api.put(`/holidays/${holiday.id}`, { ...holiday, holidayName: newName });
                        fetchSavedHolidays(viewDate);
                        closeHeaderModal();
                    } catch (err) { alert("Update failed."); }
                }
            }
        });
    };

    const handleDateClick = (clickedDate) => {
        const checkDate = new Date(clickedDate).setHours(0,0,0,0);
        const todayNoTime = new Date().setHours(0,0,0,0);
        const clickedDateStr = clickedDate.toLocaleDateString('en-CA');

        if (checkDate < todayNoTime) {
            alert("Cannot modify past dates.");
            return;
        }

        if (isRangeMode) {
            if (!rangeStart) {
                if (clickedDate.getDay() === 6) {
                    alert("Saturdays cannot be the start of a holiday range.");
                    return;
                }
                setRangeStart(clickedDate);
            } else {
                const start = rangeStart < clickedDate ? rangeStart : clickedDate;
                const end = rangeStart < clickedDate ? clickedDate : rangeStart;
                
                setModalConfig({
                    isOpen: true,
                    title: `Add Holiday Range`,
                    type: "input",
                    value: "",
                    confirmLabel: "Save Range",
                    onConfirm: async (holidayName) => {
                        if (holidayName) {
                            try {
                                // Uses your existing /bulk endpoint with RequestParams
                                await api.post('/holidays/bulk', null, {
                                    params: {
                                        start: start.toLocaleDateString('en-CA'),
                                        end: end.toLocaleDateString('en-CA'),
                                        description: holidayName, // Maps to holidayName in service
                                        type: "NATIONAL"
                                    }
                                });
                                setRangeStart(null);
                                setIsRangeMode(false);
                                fetchSavedHolidays(viewDate);
                                closeHeaderModal();
                            } catch (err) { alert("Failed to add range."); }
                        }
                    }
                });
            }
        } else {
            // SINGLE DATE LOGIC
            if (clickedDate.getDay() === 6) {
                alert("Saturdays are already marked as weekends.");
                return;
            }

            if (holidays.some(h => h.holidayDate === clickedDateStr)) {
                alert("This date is already a registered holiday.");
                return;
            }

            setModalConfig({
                isOpen: true,
                title: `New Holiday: ${clickedDateStr}`,
                type: "input",
                value: "",
                confirmLabel: "Add Holiday",
                onConfirm: async (holidayName) => {
                    if (holidayName) {
                        try {
                            await api.post('/holidays', {
                                holidayDate: clickedDateStr,
                                holidayName: holidayName,
                                holidayType: "NATIONAL"
                            });
                            fetchSavedHolidays(viewDate);
                            closeHeaderModal();
                        } catch (err) { alert("Failed to add."); }
                    }
                }
            });
        }
    };

    const indexOfLastRecord = currentPage * recordsPerPage;
    const currentRecords = holidays.slice(indexOfLastRecord - recordsPerPage, indexOfLastRecord);
    const totalPages = Math.ceil(holidays.length / recordsPerPage);

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateStr = date.toLocaleDateString('en-CA');
            const isPast = new Date(date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
            const found = holidays.find(h => h.holidayDate === dateStr);
            let classes = isPast ? 'tile-past ' : '';
            if (found) classes += (found.holidayType === 'URGENT' ? 'tile-urgent ' : 'tile-holiday ');
            if (date.getDay() === 6) classes += 'saturday ';
            if (rangeStart && dateStr === rangeStart.toLocaleDateString('en-CA')) classes += 'range-start-highlight ';
            return classes.trim();
        }
    };

    return (
        <div className="holiday-settings">
            <div className="config-header">
                <h2>Nepal Holiday Manager</h2>
                <div className="actions">
                    <button className={`range-btn ${isRangeMode ? 'active' : ''}`} onClick={() => { setIsRangeMode(!isRangeMode); setRangeStart(null); }}>
                        {isRangeMode ? "Cancel Range" : "➕ Add Range"}
                    </button>
                    <button className="sync-button" onClick={() => fetchSavedHolidays(viewDate)}>🔄 Refresh</button>
                </div>
            </div>

            <div className="main-layout">
                <div className="calendar-card-container">
                    <div className="calendar-card">
                        <Calendar 
                            value={viewDate}
                            onActiveStartDateChange={({ activeStartDate }) => setViewDate(activeStartDate)}
                            tileClassName={tileClassName}
                            onClickDay={handleDateClick}
                        />
                    </div>
                    
                    <div className="holiday-legend">
                        <h4>Legend</h4>
                        <div className="legend-grid">
                            <div className="legend-item"><span className="legend-box tile-holiday"></span><span>Holiday</span></div>
                            <div className="legend-item"><span className="legend-box saturday"></span><span>Saturday</span></div>
                            <div className="legend-item"><span className="legend-box tile-urgent"></span><span>Urgent</span></div>
                            <div className="legend-item"><span className="legend-box tile-past"></span><span>Past</span></div>
                        </div>
                    </div>
                </div>

                <div className="holiday-list-section">
                    <h3>Records: {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <div className="holiday-table-wrapper">
                        <table className="holiday-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Holiday Name</th>
                                    <th className="center-header">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRecords.map(h => (
                                    <tr key={h.id}>
                                        <td className="date-cell">{h.holidayDate}</td>
                                        <td>{h.holidayName}</td>
                                        <td className="action-cell">
                                            <button className="action-btn edit-btn" onClick={() => handleEdit(h)}>
                                                <EditIcon />
                                            </button>
                                            <button className="action-btn delete-btn" onClick={() => handleDelete(h.id)}>
                                                <DeleteIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {holidays.length === 0 && !loading && (
                                    <tr><td colSpan="3" className="empty-msg">No holidays found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}>Prev</button>
                            {[...Array(totalPages).keys()].map(n => (
                                <button key={n+1} onClick={() => setCurrentPage(n+1)} className={currentPage === n+1 ? 'active' : ''}>{n+1}</button>
                            ))}
                            <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages}>Next</button>
                        </div>
                    )}
                </div>
            </div>

            {modalConfig.isOpen && (
                <div className="modal-overlay">
                    <div className="custom-modal">
                        <h3>{modalConfig.title}</h3>
                        {modalConfig.type === "input" ? (
                            <input 
                                type="text" 
                                className="modal-input"
                                autoFocus
                                value={modalConfig.value}
                                onChange={(e) => setModalConfig({ ...modalConfig, value: e.target.value })}
                                placeholder="Enter Holiday Name (e.g. Dashain)..."
                            />
                        ) : (
                            <p className="modal-text">{modalConfig.value}</p>
                        )}
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={closeHeaderModal}>Cancel</button>
                            <button className="btn-okay" onClick={() => modalConfig.onConfirm(modalConfig.value)}>{modalConfig.confirmLabel}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HolidaySettings;