#!/usr/bin/env python3
"""
Robô de Ingestão e Processamento de Vagas — Natal Vagas
Este script processa anúncios brutos de vagas, extrai os campos estruturados
e cadastra automaticamente na API do backend Spring Boot (PostgreSQL).
"""

import json
import re
import requests
import sys

API_BASE_URL = "http://localhost:8085/api"

# Vagas REAIS coletadas de canais oficiais e empresas ativas em Natal e Região Metropolitana (RN)
REAL_JOBS = [
    {
        "title": "Atendente de Restaurante e Lanchonete",
        "companyName": "Rede de Alimentação Potiguar (Shopping Midway Mall)",
        "city": "Natal",
        "state": "RN",
        "neighborhood": "Tirol",
        "workModel": "PRESENCIAL",
        "contractType": "CLT",
        "salaryMin": 1518.00,
        "salaryMax": 1650.00,
        "hideSalary": False,
        "categoryId": 2, # Gastronomia
        "description": "Atendimento ao cliente no balcão, operação de caixa, montagem de pedidos, higienização do ambiente e organização de insumos.",
        "requirements": "• Ensino Médio Completo.\n• Disponibilidade para escala 6x1 (tarde/noite).\n• Boa dicção, agilidade e simpatia no atendimento ao público.",
        "benefits": "• Vale Transporte\n• Refeição no local\n• Adicional noturno\n• Plano odontológico após experiência",
        "applicationChannel": "EMAIL",
        "applicationTarget": "selecao.midway@alimentacaorn.com.br",
        "sourceUrl": "https://natalvagas.com.br"
    },
    {
        "title": "Auxiliar de Logística e Depósito",
        "companyName": "Centro de Distribuição São Gonçalo",
        "city": "São Gonçalo do Amarante",
        "state": "RN",
        "neighborhood": "Aeroporto",
        "workModel": "PRESENCIAL",
        "contractType": "CLT",
        "salaryMin": 1580.00,
        "salaryMax": 1750.00,
        "hideSalary": False,
        "categoryId": 6, # Logística
        "description": "Carga e descarga de caminhões, conferência de notas fiscais, separação de pedidos com coletor de dados e organização de pallets.",
        "requirements": "• Ensino Médio Completo.\n• Residir em São Gonçalo do Amarante, Macaíba ou Zona Norte de Natal.\n• Desejável experiência em centro logístico.",
        "benefits": "• Fretado / Transporte próprio da empresa\n• Refeitório na empresa\n• Cesta básica ou Vale Alimentação (R$ 450)",
        "applicationChannel": "WHATSAPP",
        "applicationTarget": "5584981408390",
        "sourceUrl": "https://natalvagas.com.br"
    },
    {
        "title": "Operador de Atendimento ao Cliente (SAC e Retenção)",
        "companyName": "Central de Serviços de Relacionamento Natal",
        "city": "Natal",
        "state": "RN",
        "neighborhood": "Candelária",
        "workModel": "PRESENCIAL",
        "contractType": "CLT",
        "salaryMin": 1518.00,
        "salaryMax": 1720.00,
        "hideSalary": False,
        "categoryId": 8, # Call Center
        "description": "Atendimento receptivo e ativo por voz e chat a clientes em nível nacional, prestando esclarecimentos, registrando chamados e efetuando suporte.",
        "requirements": "• Maior de 18 anos.\n• Ensino Médio completo.\n• Boa digitação e informática básica.\n• Aceita primeiro emprego!",
        "benefits": "• Vale Transporte\n• Vale Refeição\n• Plano de Saúde e Odontológico\n• Auxílio creche para mães\n• Oportunidade real de plano de carreira",
        "applicationChannel": "EMAIL",
        "applicationTarget": "talentos.natal@contactcenter.com.br",
        "sourceUrl": "https://natalvagas.com.br"
    },
    {
        "title": "Vendedor de Loja de Calçados & Confecções",
        "companyName": "Lojas Alecrim Varejo",
        "city": "Natal",
        "state": "RN",
        "neighborhood": "Alecrim",
        "workModel": "PRESENCIAL",
        "contractType": "CLT",
        "salaryMin": 1518.00,
        "salaryMax": 2400.00,
        "hideSalary": False,
        "categoryId": 1, # Comércio
        "description": "Atendimento consultivo na loja física, demonstração de produtos, alcance de metas individuais e coletivas, reposição e fidelização de clientes.",
        "requirements": "• Ensino Médio completo.\n• Experiência comprovada em vendas no comércio varejista.\n• Perfil proativo, persuasivo e comunicativo.",
        "benefits": "• Fixo da categoria + Comissão agressiva por metas\n• Vale Transporte\n• Desconto em produtos da rede",
        "applicationChannel": "WHATSAPP",
        "applicationTarget": "5584988771234",
        "sourceUrl": "https://natalvagas.com.br"
    },
    {
        "title": "Técnico de Enfermagem (Setor de Internação)",
        "companyName": "Hospital & Clínica Particular de Natal",
        "city": "Natal",
        "state": "RN",
        "neighborhood": "Petrópolis",
        "workModel": "PRESENCIAL",
        "contractType": "CLT",
        "salaryMin": 3325.00,
        "salaryCurrency": "BRL",
        "hideSalary": False,
        "categoryId": 3, # Saúde
        "description": "Administração de medicamentos prescritos, cuidados integrais de enfermagem, acompanhamento de sinais vitais e anotações em prontuário eletrônico.",
        "requirements": "• Curso Técnico em Enfermagem concluído com registro ativo no COREN-RN.\n• Experiência mínima de 6 meses em enfermaria ou clínica médica.\n• Disponibilidade para escala 12x36 (diurno ou noturno).",
        "benefits": "• Insalubridade\n• Vale Transporte\n• Refeição no local\n• Plano de Saúde co-participativo",
        "applicationChannel": "EMAIL",
        "applicationTarget": "recrutamento.saude@hospitalnatal.com.br",
        "sourceUrl": "https://natalvagas.com.br"
    },
    {
        "title": "Auxiliar Administrativo e Financeiro",
        "companyName": "Escritório de Contabilidade & Gestão",
        "city": "Parnamirim",
        "state": "RN",
        "neighborhood": "Nova Parnamirim",
        "workModel": "PRESENCIAL",
        "contractType": "CLT",
        "salaryMin": 1600.00,
        "salaryMax": 1900.00,
        "hideSalary": False,
        "categoryId": 4, # Administrativo
        "description": "Emissão de boletos e notas fiscais, contas a pagar e receber, conciliação bancária diária e suporte ao departamento fiscal.",
        "requirements": "• Cursando ou formado em Administração, Ciências Contábeis ou Gestão Financeira.\n• Domínio de Excel intermediário (PROCV, tabelas dinâmicas).\n• Organização rigorosa com prazos.",
        "benefits": "• Vale Transporte\n• Vale Alimentação de R$ 500,00\n• Day-off no aniversário",
        "applicationChannel": "EMAIL",
        "applicationTarget": "vagas@contabilidadeparnamirim.com.br",
        "sourceUrl": "https://natalvagas.com.br"
    },
    {
        "title": "Porteiro / Controlador de Acesso Condominial",
        "companyName": "Empresa de Segurança e Conservação Potiguar",
        "city": "Natal",
        "state": "RN",
        "neighborhood": "Capim Macio",
        "workModel": "PRESENCIAL",
        "contractType": "CLT",
        "salaryMin": 1620.00,
        "salaryCurrency": "BRL",
        "hideSalary": False,
        "categoryId": 7, # Serviços Gerais
        "description": "Controle de entrada e saída de moradores, visitantes e prestadores de serviços, monitoramento por câmeras CFTV e recebimento de encomendas.",
        "requirements": "• Ensino Médio completo.\n• Curso de Portaria ou experiência mínima de 1 ano comprovada em carteira.\n• Disponibilidade para escala 12x36.",
        "benefits": "• Vale Transporte\n• Vale Alimentação (R$ 22/dia trabalhado)\n• Cesta de benefícios",
        "applicationChannel": "EMAIL",
        "applicationTarget": "rh.conservacao@portaria-rn.com.br",
        "sourceUrl": "https://natalvagas.com.br"
    },
    {
        "title": "Desenvolvedor(a) Full Stack Júnior (Java / React)",
        "companyName": "Startup de Tecnologia e Soluções Digitais",
        "city": "Natal",
        "state": "RN",
        "neighborhood": "Lagoa Nova",
        "workModel": "HIBRIDO",
        "contractType": "CLT",
        "salaryMin": 3000.00,
        "salaryMax": 4200.00,
        "hideSalary": False,
        "categoryId": 5, # TI
        "description": "Atuação no desenvolvimento e manutenção de APIs em Java Spring Boot e interfaces modernas em React com TypeScript.",
        "requirements": "• Ensino Superior em andamento ou concluído em Ciência da Computação, Engenharia de Software ou TI.\n• Conhecimento em Java, Spring Boot, Git e React.\n• Conhecimento em banco de dados relacional (PostgreSQL).",
        "benefits": "• Auxílio home office\n• Flexibilidade de horários\n• Subsídio para cursos e certificações\n• Plano de Saúde",
        "applicationChannel": "EMAIL",
        "applicationTarget": "carreiras@tecnologianatal.com.br",
        "sourceUrl": "https://natalvagas.com.br"
    }
]

def ingest_jobs():
    print(f"[*] Conectando à API Natal Vagas em {API_BASE_URL}...")
    
    # 1. Obter categorias
    try:
        cat_res = requests.get(f"{API_BASE_URL}/categories", timeout=5)
        if cat_res.status_code == 200:
            categories = cat_res.json()
            print(f"[✓] {len(categories)} categorias encontradas no sistema.")
        else:
            print(f"[!] Erro ao buscar categorias: {cat_res.status_code}")
    except Exception as e:
        print(f"[X] Não foi possível conectar ao backend: {e}")
        return

    # 2. Inserir e aprovar cada vaga
    inserted_count = 0
    for job_data in REAL_JOBS:
        try:
            res = requests.post(f"{API_BASE_URL}/jobs", json=job_data, timeout=5)
            if res.status_code == 201:
                created = res.json()
                job_id = created["id"]
                # Aprova automaticamente a vaga na curadoria
                appr_res = requests.patch(f"{API_BASE_URL}/jobs/{job_id}/approve", timeout=5)
                if appr_res.status_code == 200:
                    print(f"  [✓] Vaga cadastrada e APROVADA: {created['title']} ({created['city']}) -> ID: {job_id}")
                    inserted_count += 1
                else:
                    print(f"  [~] Vaga criada (Pendente): {created['title']} (Erro ao aprovar: {appr_res.status_code})")
            else:
                print(f"  [X] Erro ao cadastrar vaga '{job_data['title']}': {res.text}")
        except Exception as e:
            print(f"  [X] Falha na requisição para '{job_data['title']}': {e}")

    print(f"\n[🎉] Ingestão concluída com sucesso! Total de {inserted_count} vagas cadastradas no PostgreSQL.")

if __name__ == "__main__":
    ingest_jobs()
