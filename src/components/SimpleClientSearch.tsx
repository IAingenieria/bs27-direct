import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  tipo_cliente: string;
}

interface SimpleClientSearchProps {
  onClientSelect: (client: Client) => void;
  onNewClient: () => void;
  selectedClient?: Client | null;
  onClearClient: () => void;
}

const SimpleClientSearch: React.FC<SimpleClientSearchProps> = ({
  onClientSelect,
  onNewClient,
  selectedClient,
  onClearClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, telefono, email, tipo_cliente')
        .ilike('nombre', `%${searchTerm.trim()}%`)
        .limit(10);

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Error de búsqueda",
          description: "No se pudo buscar clientes",
          variant: "destructive",
        });
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error de búsqueda",
        description: "Error al buscar clientes",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setSearchResults([]);
    setSearchTerm('');
  };

  if (selectedClient) {
    return (
      <div>
        <Label>Cliente Seleccionado</Label>
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium text-green-800">{selectedClient.nombre}</div>
              <div className="text-sm text-green-600">{selectedClient.telefono}</div>
              {selectedClient.email && (
                <div className="text-sm text-green-600">{selectedClient.email}</div>
              )}
              <div className="text-xs text-green-600 capitalize">{selectedClient.tipo_cliente}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearClient}
            >
              ✕
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Cliente *</Label>
      <div className="flex gap-2">
        <Input
          placeholder="Nombre del cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          className="flex-1"
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSearch}
          disabled={!searchTerm.trim() || isSearching}
        >
          {isSearching ? 'Buscando...' : 'Buscar'}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onNewClient}
        >
          + Nuevo
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
          {searchResults.map((client) => (
            <div
              key={client.id}
              onClick={() => handleClientSelect(client)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{client.nombre}</div>
              <div className="text-sm text-gray-500">{client.telefono}</div>
              {client.email && (
                <div className="text-sm text-gray-500">{client.email}</div>
              )}
              <div className="text-xs text-blue-600 capitalize">{client.tipo_cliente}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleClientSearch;
