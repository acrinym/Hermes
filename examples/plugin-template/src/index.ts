export default function main() {
  console.log('Hermes plugin ready! 🚀');
}

// Hot reload support
if ((import.meta as any).hot) {
  (import.meta as any).hot.accept(() => {
    console.log('🔄 Plugin hot reloaded!');
  });
}
