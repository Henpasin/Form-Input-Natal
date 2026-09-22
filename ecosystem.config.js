module.exports = {
  apps: [
    {
      name: 'natal',
      script: 'app.js', // Entry point aplikasi
      instances: 'max', // Gunakan semua core CPU yang tersedia
      exec_mode: 'cluster', // Mode cluster
      watch: false, // Nonaktifkan watch mode untuk cluster mode
      autorestart: true, // Restart otomatis jika aplikasi crash
      max_memory_restart: '300M', // Restart jika penggunaan memori lebih dari 500MB
    },
  ],
};
