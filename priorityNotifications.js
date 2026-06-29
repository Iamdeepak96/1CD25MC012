const axios = require("axios");

const API_URL = "http://4.224.186.213/evaluation-service/notifications";


const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzaGV0ZGVlcGFrOTZAZ21haWwuY29tIiwiZXhwIjoxNzgyNzEzNDMzLCJpYXQiOjE3ODI3MTI1MzMsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJlNWQzNDhjOC1iYjJmLTQ3NGMtOTllYS02ZTFmN2U3NWNiNDUiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJkZWVwYWsgc2hldCIsInN1YiI6IjM0NDRjZDE4LThmYWYtNGU5Ny04MjNjLTgwYzVlYThkMDAwOSJ9LCJlbWFpbCI6InNoZXRkZWVwYWs5NkBnbWFpbC5jb20iLCJuYW1lIjoiZGVlcGFrIHNoZXQiLCJyb2xsTm8iOiIxY2QyNW1jMDEyIiwiYWNjZXNzQ29kZSI6IkFwbnBUbSIsImNsaWVudElEIjoiMzQ0NGNkMTgtOGZhZi00ZTk3LTgyM2MtODBjNWVhOGQwMDA5IiwiY2xpZW50U2VjcmV0IjoiQ3BrbmdBY2RuTVN1cm1ZcCJ9.aNSqvotxK6UyBMkgOtKEmlvik5Lho-n2IPrxR2kFjHM";

const PRIORITY = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

async function getTopNotifications() {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    
    const notifications = response.data.notifications || response.data;

    notifications.sort((a, b) => {
      const p1 = PRIORITY[a.Type] || 0;
      const p2 = PRIORITY[b.Type] || 0;

      if (p1 !== p2) {
        return p2 - p1;
      }

      return new Date(b.Timestamp) - new Date(a.Timestamp);
    });

    console.log("\n===== TOP 10 UNREAD NOTIFICATIONS =====\n");
    console.table(notifications.slice(0, 10));
  } catch (err) {
    console.error("Error fetching notifications:");
    console.error(err.response?.data || err.message);
  }
}

getTopNotifications();