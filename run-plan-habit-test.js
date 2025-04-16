// Script to run the PlanHabitItem test
import { createServer } from 'vite';

async function startServer() {
  const server = await createServer({
    // Configure Vite
    configFile: false,
    root: '.',
    server: {
      port: 3001,
      open: '/test-plan-habit-item.html',
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  });

  await server.listen();

  console.log('Test server running at:');
  server.printUrls();
  console.log('\nPress Ctrl+C to stop the server');
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
