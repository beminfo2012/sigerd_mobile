# Diário de Abertura — V1: Captura, Medição e Classificação Automática
### (sem gráfico de evolução, sem alerta automático de taxa de crescimento)

## 1. Escopo desta fase

**Entra:**
- Cadastro do ponto de abertura, vinculado ao imóvel (e opcionalmente à vistoria/NOPRER)
- Registro fotográfico com foto original preservada (hash, fonte de data/hora, fonte de geolocalização)
- Campo de medição em mm, sempre com validação humana obrigatória antes de virar oficial
- **Classificação automática da patologia** (fissura/trinca/rachadura/fenda/brecha) a partir da largura validada, conforme referência IBAPE-MG
- Tela com duas abas: foto original / versão anotada (opcional, derivada)

**Fica de fora por enquanto:**
- Gráfico de evolução (linha do tempo visual)
- Cálculo automático de taxa de crescimento e alerta de limiar
- Geração automática de NOPRER a partir desse alerta

**Por quê:** evita acoplar o MVP a uma lógica de threshold que ainda não foi calibrada com dados reais, e mantém a mudança 100% aditiva — nenhuma tabela ou regra existente do SIGERD (Vistoria, NOPRER, motor de risco) é tocada nesta fase.

**Nota terminológica** (motivo da renomeação em relação à versão anterior desta spec): fissura, trinca e rachadura são patologias distintas, diferenciadas principalmente pela largura da abertura — não são sinônimos. O módulo e as tabelas foram renomeados de "fissura" para "abertura" (termo genérico que a literatura técnica usa para a medida em si), e a classificação correta passa a ser calculada pelo sistema, não assumida pelo nome do módulo.

## 2. Modelo de dados (SQLAlchemy)

```python
# models/abertura.py
import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, Numeric, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.base import Base  # Base já com RLS configurado no projeto

class StatusAbertura(str, Enum):
    ativa = "ativa"
    estabilizada = "estabilizada"
    encerrada = "encerrada"

class FonteDataHora(str, Enum):
    exif_foto = "exif_foto"
    gps_dispositivo = "gps_dispositivo"

class MetodoMedicao(str, Enum):
    manual_agente = "manual_agente"
    visao_computacional_auto = "visao_computacional_auto"  # reservado para fase futura

class ClassificacaoPatologia(str, Enum):
    fissura = "fissura"
    trinca = "trinca"
    rachadura = "rachadura"
    fenda = "fenda"
    brecha = "brecha"


class AberturaPatologica(Base):
    __tablename__ = "abertura_patologica"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # RLS
    imovel_id = Column(UUID(as_uuid=True), ForeignKey("imovel.id"), nullable=False)
    vistoria_id = Column(UUID(as_uuid=True), ForeignKey("vistoria.id"), nullable=True)
    nopper_id = Column(UUID(as_uuid=True), ForeignKey("nopper.id"), nullable=True)

    codigo_ponto = Column(String(20), nullable=False)          # ex.: "AB-014"
    localizacao_descricao = Column(String(255), nullable=False)
    categoria = Column(String(20), nullable=False, default="Estrutural")
    status = Column(SAEnum(StatusAbertura), nullable=False, default=StatusAbertura.ativa)

    criado_por = Column(UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False)
    data_abertura = Column(DateTime, nullable=False, default=datetime.utcnow)

    registros = relationship(
        "AberturaRegistroFotografico",
        back_populates="abertura",
        order_by="AberturaRegistroFotografico.data_hora",
    )


class AberturaRegistroFotografico(Base):
    __tablename__ = "abertura_registro_fotografico"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # RLS
    abertura_id = Column(UUID(as_uuid=True), ForeignKey("abertura_patologica.id"), nullable=False)

    foto_url = Column(String(500), nullable=False)             # objeto no MinIO, imutável
    hash_sha256 = Column(String(64), nullable=False)

    data_hora = Column(DateTime, nullable=False)
    fonte_data_hora = Column(SAEnum(FonteDataHora), nullable=False)

    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)
    fonte_geolocalizacao = Column(String(50), nullable=True)   # reaproveita enum já existente no rastreamento de agentes

    largura_mm_medida = Column(Numeric(6, 2), nullable=True)

    classificacao_patologia = Column(SAEnum(ClassificacaoPatologia), nullable=True)  # calculado na validação
    fonte_classificacao = Column(String(30), nullable=True, default="IBAPE-MG")      # qual tabela de referência classificou

    metodo_medicao = Column(SAEnum(MetodoMedicao), nullable=True, default=MetodoMedicao.manual_agente)
    confianca_deteccao = Column(Numeric(5, 2), nullable=True)   # nulo quando o método é manual

    validado_por = Column(UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=True)
    validado_em = Column(DateTime, nullable=True)
    observacoes = Column(Text, nullable=True)

    abertura = relationship("AberturaPatologica", back_populates="registros")
```

```python
# services/classificacao_patologia.py
from decimal import Decimal
from models.abertura import ClassificacaoPatologia

# Referência: IBAPE-MG. Guardar como tabela isolada (não espalhar os limiares
# pelo código) para permitir troca de norma no futuro sem tocar na lógica de negócio.
FAIXAS_IBAPE_MG = [
    (Decimal("0.5"), ClassificacaoPatologia.fissura),
    (Decimal("1.0"), ClassificacaoPatologia.trinca),
    (Decimal("5.0"), ClassificacaoPatologia.rachadura),
    (Decimal("10.0"), ClassificacaoPatologia.fenda),
]

def classificar_abertura(largura_mm: Decimal) -> ClassificacaoPatologia:
    """Classifica a abertura pela largura medida, conforme IBAPE-MG.

    IMPORTANTE: esta classificação é descritiva (nomeia a patologia pela
    largura). Não define, por si só, o grau de risco — isso continua exigindo
    diagnóstico de origem e monitoramento de atividade. Não usar o retorno
    desta função como critério automático de severidade em nenhum lugar do
    sistema.
    """
    for limite, classificacao in FAIXAS_IBAPE_MG:
        if largura_mm <= limite:
            return classificacao
    return ClassificacaoPatologia.brecha
```

Nenhuma tabela de alerta ou de série histórica entra nesta fase — só as duas tabelas acima, mais o serviço de classificação (que não persiste nada por conta própria, só calcula).

## 3. Regras já herdadas do SIGERD (sem exceção aqui)

- RLS via `tenant_id` nas duas tabelas, seguindo o padrão já adotado no resto do sistema
- `data_hora` e geolocalização nunca gravados sem fonte real verificável — mesma regra já em vigor no módulo de fotos de Vistoria
- Nenhuma medição vira oficial sem `validado_por` e `validado_em` preenchidos
- **Nova regra desta fase**: a classificação da patologia é sempre recalculada a partir da largura validada, nunca digitada livremente pelo agente — evita divergência entre o valor medido e o rótulo exibido

## 4. Endpoints (FastAPI)

```python
# routers/abertura.py
from fastapi import APIRouter, Depends, UploadFile, File, Form
from uuid import UUID

router = APIRouter(prefix="/aberturas", tags=["aberturas"])

@router.post("/")
def criar_abertura(payload: AberturaCreate, user=Depends(get_current_user)):
    """Cria um novo ponto de abertura vinculado a um imóvel (e opcionalmente a uma vistoria/NOPRER)."""
    ...

@router.post("/{abertura_id}/registros")
async def criar_registro_fotografico(
    abertura_id: UUID,
    foto: UploadFile = File(...),
    data_hora: str = Form(...),
    fonte_data_hora: str = Form(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    fonte_geolocalizacao: str | None = Form(None),
    user=Depends(get_current_user),
):
    """
    1. Sobe a foto original para o MinIO, sem qualquer alteração
    2. Calcula hash_sha256 sobre o arquivo recebido
    3. Grava o registro com largura_mm_medida = None (pendente de medição)
    """
    ...

@router.patch("/registros/{registro_id}/medicao")
def validar_medicao(
    registro_id: UUID,
    largura_mm: float,
    metodo_medicao: str = "manual_agente",
    observacoes: str | None = None,
    user=Depends(get_current_user),
):
    """
    Único endpoint que grava largura_mm_medida como oficial.
    Sempre define validado_por = usuário atual e validado_em = agora.
    Sempre chama classificar_abertura(largura_mm) e grava
    classificacao_patologia + fonte_classificacao = "IBAPE-MG" junto.
    """
    ...

@router.get("/{abertura_id}/registros")
def listar_registros(abertura_id: UUID, user=Depends(get_current_user)):
    """Lista o histórico de registros em ordem cronológica — usado só para exibição em lista, sem cálculo de tendência."""
    ...
```

## 5. Frontend — componente React (sem chart, sem alerta)

```jsx
// AberturaRegistro.jsx
import { useState } from "react";

const ROTULO_CLASSIFICACAO = {
  fissura: "Fissura",
  trinca: "Trinca",
  rachadura: "Rachadura",
  fenda: "Fenda",
  brecha: "Brecha",
};

export default function AberturaRegistro({ registro, onValidar }) {
  const [aba, setAba] = useState("original");
  const [largura, setLargura] = useState(registro.largura_mm_medida ?? "");

  return (
    <div className="max-w-sm mx-auto border rounded-xl overflow-hidden">
      <div className="p-4 border-b">
        <p className="text-xs text-neutral-500">Abertura {registro.codigo_ponto}</p>
        <h1 className="text-lg font-semibold">{registro.localizacao_descricao}</h1>
      </div>

      <div className="flex gap-2 p-3">
        <button
          className={`flex-1 text-xs py-2 rounded-lg ${aba === "original" ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
          onClick={() => setAba("original")}
        >
          Foto original
        </button>
        <button
          className={`flex-1 text-xs py-2 rounded-lg ${aba === "anotada" ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
          onClick={() => setAba("anotada")}
        >
          Versão anotada
        </button>
      </div>

      <img
        src={aba === "original" ? registro.foto_url : registro.foto_anotada_url}
        alt="Registro da abertura"
        className="w-full"
      />

      <div className="p-4 text-xs text-neutral-500 space-y-1 border-b">
        <p>SHA-256: {registro.hash_sha256.slice(0, 8)}...</p>
        <p>Data/hora: {registro.data_hora} · fonte: {registro.fonte_data_hora}</p>
        {registro.latitude && <p>Geo: {registro.latitude}, {registro.longitude}</p>}
      </div>

      <div className="p-4 space-y-2">
        <label className="text-xs uppercase text-neutral-500">Medição (mm)</label>
        <input
          type="number"
          step="0.1"
          value={largura}
          onChange={(e) => setLargura(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full text-sm"
        />
        <button
          onClick={() => onValidar(registro.id, largura)}
          className="w-full bg-neutral-900 text-white text-sm py-2 rounded-lg"
        >
          Confirmar medição
        </button>

        {registro.classificacao_patologia && (
          <div className="text-xs bg-orange-50 border border-orange-200 text-orange-800 rounded-lg px-3 py-2">
            <b>{ROTULO_CLASSIFICACAO[registro.classificacao_patologia]}</b>
            {" "}· ref. {registro.fonte_classificacao}
            <p className="text-[10px] text-orange-700 mt-1">
              Classificação descreve a largura medida — não define, por si só, o grau de risco.
            </p>
          </div>
        )}

        {registro.validado_por && (
          <p className="text-xs text-neutral-500">
            Validado por {registro.validado_por_nome} em {registro.validado_em}
          </p>
        )}
      </div>
    </div>
  );
}
```

Sem `recharts`, sem cálculo de taxa/limiar neste componente — só captura, validação e classificação.

## 6. Onde fica o gancho pro motor de risco e NOPRER (não implementar ainda)

Quando fizer sentido avançar, isso vira só um serviço adicional — sem tocar em nada construído aqui:

```python
# services/risco_abertura.py (fase futura — não implementar agora)
def calcular_taxa_crescimento(abertura_id: UUID) -> float:
    registros = listar_registros_validados(abertura_id)  # já existe, já ordenado por data_hora
    # (data2 - data1) e (largura2 - largura1) já estão todos gravados
    ...

def detectar_mudanca_de_categoria(abertura_id: UUID) -> bool:
    """Fase futura: comparar classificacao_patologia entre os dois últimos
    registros validados (ex.: trinca -> rachadura) como gatilho adicional de alerta,
    complementar à taxa de crescimento."""
    ...
```

- **Motor de sugestão de risco**: já pode consultar `abertura_registro_fotografico.largura_mm_medida` e `classificacao_patologia` como estão hoje — só precisa adicionar a regra ponderada com sua própria `fonte`, sem alterar schema.
- **Geração automática de NOPRER**: seria só mais um gatilho rodando sobre esse serviço, criando um `nopper_id` novo e linkando de volta em `abertura_patologica.nopper_id`.

A arquitetura já nasce pronta pra essa conexão. O que falta não é estrutura — é a calibração do limiar de taxa de crescimento, que só faz sentido depois de acumular dados reais de campo. A classificação por largura (IBAPE-MG), por outro lado, já está pronta e correta desde o V1.
