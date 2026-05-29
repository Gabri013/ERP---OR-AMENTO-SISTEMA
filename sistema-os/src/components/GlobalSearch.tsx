import { useState, useEffect } from "react";
import { Search, X, FileText, Package, Users, Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "cliente" | "produto" | "os" | "venda" | "orcamento";
  href: string;
  icon: React.ReactNode;
}

export function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Simulação de busca global - em produção, isso viria da API
    const mockResults: SearchResult[] = [
      {
        id: "1",
        title: "Cliente Exemplo Ltda",
        description: "Cliente ativo com 3 ordens de serviço",
        type: "cliente",
        href: "/cadastros/clientes",
        icon: <Users className="h-4 w-4" />,
      },
      {
        id: "2",
        title: "Produto Industrial 123",
        description: "Produto em estoque: 50 unidades",
        type: "produto",
        href: "/cadastros/produtos",
        icon: <Package className="h-4 w-4" />,
      },
      {
        id: "3",
        title: "OS-2024-001",
        description: "Ordem de serviço em andamento - Corte",
        type: "os",
        href: "/os/1",
        icon: <Wrench className="h-4 w-4" />,
      },
      {
        id: "4",
        title: "Venda #1234",
        description: "Venda concluída - R$ 15.000,00",
        type: "venda",
        href: "/vendas/1234",
        icon: <FileText className="h-4 w-4" />,
      },
    ];

    const filtered = mockResults.filter(
      (result) =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setLocation(result.href);
    onClose();
  };

  const getIconForType = (type: SearchResult["type"]) => {
    switch (type) {
      case "cliente":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "produto":
        return <Package className="h-4 w-4 text-green-600" />;
      case "os":
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case "venda":
        return <FileText className="h-4 w-4 text-purple-600" />;
      case "orcamento":
        return <FileText className="h-4 w-4 text-pink-600" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Busca Global</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes, produtos, ordens de serviço..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-4 max-h-[400px] overflow-y-auto">
          {query && results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum resultado encontrado para "{query}"</p>
            </div>
          ) : query && results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="mt-1">{getIconForType(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Digite para buscar no sistema</p>
              <p className="text-xs mt-2">
                Dica: Use Ctrl+K para abrir a busca global
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border bg-muted">Ctrl</kbd>
              <kbd className="px-1.5 py-0.5 rounded border bg-muted">K</kbd>
              <span>para abrir</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border bg-muted">Esc</kbd>
              <span>para fechar</span>
            </span>
          </div>
          <span>{results.length} resultados</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
