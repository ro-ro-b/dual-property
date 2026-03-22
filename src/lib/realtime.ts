type Client = {
  id: string;
  controller: ReadableStreamDefaultController;
};

class SSEManager {
  private clients: Map<string, Client> = new Map();

  addClient(id: string, controller: ReadableStreamDefaultController) {
    this.clients.set(id, { id, controller });
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  broadcast(event: string, data: unknown) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    for (const client of Array.from(this.clients.values())) {
      try {
        client.controller.enqueue(encoder.encode(message));
      } catch {
        this.removeClient(client.id);
      }
    }
  }

  sendToClient(clientId: string, event: string, data: unknown) {
    const client = this.clients.get(clientId);
    if (!client) return;
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    try {
      client.controller.enqueue(new TextEncoder().encode(message));
    } catch {
      this.removeClient(clientId);
    }
  }

  get clientCount() {
    return this.clients.size;
  }
}

export const sseManager = new SSEManager();
