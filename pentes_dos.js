import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Konfigurasi Beban (Skenario Pentes DoS/Spike)
export const options = {
  stages: [
    { duration: '10s', target: 20 },  // Naik cepat ke 20 pengguna virtual (VUs)
    { duration: '30s', target: 200 }, // Lonjakan ekstrem ke 200 VUs untuk menekan server
    { duration: '10s', target: 0 },   // Turun kembali ke 0
  ],
  thresholds: {
    // Pentes Threshold: Jika kegagalan request > 5%, tandai sistem rentan/gagal
    http_req_failed: ['rate<0.05'], 
    // Mengukur waktu respons server di bawah tekanan
    http_req_duration: ['p(95)<2000'], // 95% request harus di bawah 2 detik
  },
};

// 2. Target Pengujian
export default function () {
  // GANTI URL dengan target lab/sandbox Anda. JANGAN serang website publik orang lain!
  const url = 'https://game-bouncy-hush.ngrok-free.dev';
  
  // payload payload buatan untuk mensimulasikan login request
  const payload = JSON.stringify({
    username: 'admin',
    password: 'password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'K6-Pentes-Agent/1.0',
    },
  };

  // Kirim HTTP POST request secara massal
  const res = http.post(url, payload, params);

  // 3. Validasi Respons (Pentes Check)
  check(res, {
    'status is 200': (r) => r.status === 200,
    // Jika sistem memiliki sistem proteksi (WAF/Rate Limiter), ia harus merespons dengan 429
    'protected by rate limiter (429)': (r) => r.status === 429, 
  });

  // Jeda sangat singkat (0.1 detik) untuk memaksimalkan tekanan
  sleep(0.1);
}
