export type TicketStatus = "ABERTO" | "AGUARDANDO" | "CONCLUIDO" | "CANCELADO";

export interface TicketMock {
  id: string;
  titulo: string;
  solicitante: string;
  unidade: string;
  categoria: string;
  status: TicketStatus;
  criadoEm: string; // ISO
}

export const ticketsMock: TicketMock[] = Array.from({ length: 24 }).map(
  (_, i) => {
    const statuses: TicketStatus[] = [
      "ABERTO",
      "AGUARDANDO",
      "CONCLUIDO",
      "CANCELADO",
    ];
    const cats = [
      "Internet",
      "CFTV",
      "Notebook/Desktop",
      "Sistema EVO",
      "Som",
      "Catraca",
    ];
    const status = statuses[i % statuses.length];
    const day = (i % 27) + 1;
    return {
      id: `TCK-${(1000 + i).toString()}`,
      titulo: `${cats[i % cats.length]} - Ocorrência ${i + 1}`,
      solicitante: ["Bruna", "Carlos", "Diego", "Fernanda", "Gustavo"][i % 5],
      unidade: ["Centro", "Zona Sul", "Zona Norte", "Zona Leste"][i % 4],
      categoria: cats[i % cats.length],
      status,
      criadoEm: new Date(2025, 0, day, 9 + (i % 8)).toISOString(),
    };
  },
);

export interface UsuarioMock {
  id: string;
  nome: string;
  email: string;
  perfil: "Administrador" | "Agente" | "Padrão";
  bloqueado?: boolean;
}

export const usuariosMock: UsuarioMock[] = [
  {
    id: "U-01",
    nome: "Ana Lima",
    email: "ana@evoque.com",
    perfil: "Administrador",
  },
  {
    id: "U-02",
    nome: "Bruno Alves",
    email: "bruno@evoque.com",
    perfil: "Agente",
  },
  {
    id: "U-03",
    nome: "Carla Souza",
    email: "carla@evoque.com",
    perfil: "Padrão",
    bloqueado: true,
  },
  {
    id: "U-04",
    nome: "Daniel Reis",
    email: "daniel@evoque.com",
    perfil: "Agente",
  },
];

export interface UnidadeMock {
  id: string;
  nome: string;
  cidade: string;
}
export const unidadesMock: UnidadeMock[] = [
  { id: "UN-01", nome: "Centro", cidade: "São Paulo" },
  { id: "UN-02", nome: "Zona Sul", cidade: "São Paulo" },
  { id: "UN-03", nome: "Zona Norte", cidade: "São Paulo" },
  { id: "UN-04", nome: "Zona Leste", cidade: "São Paulo" },
];
