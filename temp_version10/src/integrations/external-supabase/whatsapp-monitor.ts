import { externalSupabase } from './client';

export interface ChatHistory {
  id: number;
  session_id: string;
  message: {
    type: 'human' | 'ai';
    content: string | string[];
    additional?: any;
  };
  created_at?: string;
}

export interface WhatsAppActivity {
  id: string;
  type: 'whatsapp';
  client: string;
  phone: string;
  email: string;
  vehicle: {
    brand: string;
    model: string;
    year: string;
  };
  sessionId: string;
  summary: string;
}

export const whatsappMonitor = {
  async getRecentMessages(limit: number = 10): Promise<ChatHistory[]> {
    try {
      const { data, error } = await externalSupabase
        .from('n8n_chat_histories')
        .select('*')
        .order('id', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data as ChatHistory[];
    } catch (error) {
      console.error('Error in getRecentMessages:', error);
      return [];
    }
  },

  async getWhatsAppActivities(limit: number = 5): Promise<WhatsAppActivity[]> {
    try {
      const messages = await this.getRecentMessages(50);
      
      // Agrupar por sesión
      const sessionGroups: { [key: string]: ChatHistory[] } = {};
      messages.forEach(message => {
        if (!sessionGroups[message.session_id]) {
          sessionGroups[message.session_id] = [];
        }
        sessionGroups[message.session_id].push(message);
      });

      const activities: WhatsAppActivity[] = [];

      for (const [sessionId, sessionMessages] of Object.entries(sessionGroups)) {
        if (activities.length >= limit) break;

        const sortedMessages = sessionMessages.sort((a, b) => a.id - b.id);
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        const firstHumanMessage = sortedMessages.find(m => m.message.type === 'human');
        
        // Extraer información del cliente y vehículo
        const customerInfo = this.extractCustomerInfo(sortedMessages);
        const vehicleInfo = this.extractVehicleInfo(sortedMessages);
        const summary = this.extractSummary(sortedMessages);

        activities.push({
          id: `whatsapp-${sessionId}`,
          type: 'whatsapp',
          client: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email,
          vehicle: vehicleInfo,
          sessionId,
          summary
        });
      }

      return activities;

    } catch (error) {
      console.error('Error in getWhatsAppActivities:', error);
      return [];
    }
  },

  extractCustomerInfo(messages: ChatHistory[]) {
    let name = 'Cliente';
    let phone = '';
    let email = '';

    for (const message of messages) {
      // Extraer teléfono del session_id (como fallback)
      if (message.session_id.includes(':') && !phone) {
        const phoneMatch = message.session_id.match(/user:(\d+)/);
        if (phoneMatch) {
          phone = `+52${phoneMatch[1]}`;
        }
      }

      // Prioridad: Extraer teléfono del resumen de la IA
      if (message.message.type === 'ai') {
        const content = Array.isArray(message.message.content) 
          ? message.message.content.join(' ')
          : message.message.content;
        const summaryPhoneMatch = content.match(/•\s+WhatsApp:\s+([0-9]+)/);
        if (summaryPhoneMatch && summaryPhoneMatch[1]) {
          phone = `+52${summaryPhoneMatch[1]}`; // Sobrescribe si lo encuentra
        }
      }

      // Extraer contenido del mensaje
      const content = Array.isArray(message.message.content) 
        ? message.message.content.join(' ')
        : message.message.content;
      const contentLower = content.toLowerCase();
      
      // Extraer nombre
      if (contentLower.includes('mi nombre es') || contentLower.includes('me llamo') || contentLower.includes('soy ')) {
        const nameMatch = content.match(/(?:mi nombre es|me llamo|soy)\s+([a-záéíóúñ\s]+)/i);
        if (nameMatch && nameMatch[1]) {
          name = nameMatch[1].trim().split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      }

      // Buscar nombres en mensajes AI que confirmen información
      if (message.message.type === 'ai') {
        const confirmMatch = content.match(/confirmo que tu nombre es ([a-záéíóúñ\s]+)/i);
        if (confirmMatch && confirmMatch[1]) {
          name = confirmMatch[1].trim().split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      }

      // Extraer email
      const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch && !email) {
        email = emailMatch[1];
      }
    }

    return { name, phone, email };
  },

  extractVehicleInfo(messages: ChatHistory[]) {
    let brand = '';
    let model = '';
    let year = '';

    for (const message of messages) {
      const content = Array.isArray(message.message.content) 
        ? message.message.content.join(' ')
        : message.message.content;
      const contentLower = content.toLowerCase();

      // Buscar marca y modelo juntos (ej: "BMW X3", "Honda Civic", "Toyota Corolla")
      const vehiclePatterns = [
        /\b(bmw)\s+([a-z0-9]+)\b/i,
        /\b(honda)\s+([a-z]+)\b/i,
        /\b(toyota)\s+([a-z]+)\b/i,
        /\b(nissan)\s+([a-z]+)\b/i,
        /\b(ford)\s+([a-z]+)\b/i,
        /\b(chevrolet|chevy)\s+([a-z]+)\b/i,
        /\b(volkswagen|vw)\s+([a-z]+)\b/i,
        /\b(audi)\s+([a-z0-9]+)\b/i,
        /\b(mercedes)\s+([a-z0-9]+)\b/i,
        /\b(hyundai)\s+([a-z]+)\b/i,
        /\b(kia)\s+([a-z]+)\b/i
      ];

      for (const pattern of vehiclePatterns) {
        const match = content.match(pattern);
        if (match && !brand) {
          brand = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          model = match[2].toUpperCase();
        }
      }

      // Buscar año (4 dígitos entre 1990 y 2030)
      const yearMatch = content.match(/\b(19[9]\d|20[0-3]\d)\b/);
      if (yearMatch && !year) {
        year = yearMatch[1];
      }
    }

    return { brand, model, year };
  },

  extractSummary(messages: ChatHistory[]): string {
    for (const message of messages) {
      if (message.message.type === 'ai') {
        const content = Array.isArray(message.message.content)
          ? message.message.content.join(' ')
          : message.message.content;

        if (content.includes('DATOS DEL CLIENTE')) {
          try {
            const summaryPart = content.substring(content.indexOf('[\n  "Perfecto'));
            const parsed = JSON.parse(summaryPart);
            if (Array.isArray(parsed)) {
              const serviceIndex = parsed.findIndex((line: string) => line.includes('SERVICIO REQUERIDO'));
              const contextIndex = parsed.findIndex((line: string) => line.includes('CONDICIÓN/CONTEXTO'));
              const nextStepIndex = parsed.findIndex((line: string) => line.includes('SIGUIENTE PASO'));

              if (serviceIndex > -1 && nextStepIndex > -1) {
                const summaryLines = parsed.slice(serviceIndex, nextStepIndex);
                // Clean up the lines for better display
                return summaryLines
                  .filter(line => line.trim() !== '' && !line.includes('SERVICIO REQUERIDO') && !line.includes('CONDICIÓN/CONTEXTO'))
                  .map(line => line.replace(/•\s/g, ''))
                  .join('\n');
              }
            }
          } catch (e) {
            // Fallback for simpler extraction
            const serviceMatch = content.match(/SERVICIO REQUERIDO:([\s\S]*?)(\n\n|✅)/);
            if (serviceMatch && serviceMatch[1]) {
              return serviceMatch[1].replace(/•/g, '').trim();
            }
          }
        }
      }
    }
    return 'No se pudo generar el resumen.';
  },

  getRelativeTime(messageId: number): string {
    // Como no tenemos timestamp real, simulamos tiempo reciente basado en el ID
    // IDs más altos = más recientes
    const maxId = 1000; // Aproximación del ID más alto
    const relativeAge = Math.max(0, maxId - messageId);
    
    if (relativeAge < 10) return 'Hace menos de 1 hora';
    if (relativeAge < 50) return 'Hace unas horas';
    if (relativeAge < 200) return 'Hace 1 día';
    if (relativeAge < 500) return 'Hace unos días';
    
    return 'Hace una semana';
  }
};
