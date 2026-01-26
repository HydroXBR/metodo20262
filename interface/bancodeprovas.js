class BancoDeProvas {
    constructor() {
        this.currentVestibular = 'sis';
        this.currentEtapa = 'i';
        this.provasData = {
            sis: {
                i: this.getSISProvasI(),
                ii: this.getSISProvasII(),
                iii: this.getSISProvasIII()
            },
            psc: {
                // Será preenchido posteriormente
                i: [],
                ii: [],
                iii: []
            },
            macro: {
                // Será preenchido posteriormente
                provas: []
            },
            psi: {
                // Será preenchido posteriormente
                provas: []
            },
            enem: {
                // Será preenchido posteriormente
                provas: []
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
        this.showSISProvas();
    }

    setupEventListeners() {
        // Tabs de vestibular
        document.querySelectorAll('.vest-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const vestibular = e.target.dataset.vestibular;
                this.switchVestibular(vestibular);
            });
        });

        // Tabs de etapa (SIS)
        document.querySelectorAll('.etapa-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const etapa = e.target.dataset.etapa;
                this.switchEtapa(etapa);
            });
        });

        // Menu mobile
        const menuToggle = document.getElementById('menuToggle');
        const navMobile = document.getElementById('navMobile');
        menuToggle?.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navMobile.classList.toggle('active');
        });

        // Header scroll
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            header?.classList.toggle('scrolled', window.scrollY > 50);
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('user');
                window.location.href = '/login.html';
            }
        });
    }

    switchVestibular(vestibular) {
        this.currentVestibular = vestibular;

        // Atualizar tabs ativas
        document.querySelectorAll('.vest-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.vestibular === vestibular);
        });

        // Mostrar/ocultar seletor de etapa
        const etapaSelector = document.getElementById('sisEtapaSelector');
        const comingSoon = document.getElementById('comingSoon');
        
        if (vestibular === 'sis') {
            etapaSelector.classList.add('active');
            comingSoon.classList.remove('active');
            this.showSISProvas();
        } else {
            etapaSelector.classList.remove('active');
            comingSoon.classList.add('active');
            this.clearProvasGrid();
        }
    }

    switchEtapa(etapa) {
        this.currentEtapa = etapa;

        // Atualizar tabs ativas
        document.querySelectorAll('.etapa-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.etapa === etapa);
        });

        // Mostrar provas da etapa selecionada
        this.showSISProvas();
    }

    getSISProvasI() {
        // Links fornecidos para SIS I
        const links = [
            'https://drive.google.com/open?id=1RRz6Qy9AsypsTjH2slUPvawuH-Joqo1Y&usp=drive_copy',
            'https://drive.google.com/open?id=1omGeQt6IuiOhT_VF5Tc6DBe4lQweNJ-M&usp=drive_copy',
            'https://drive.google.com/open?id=1rWhXml5oX5c_hDU8kUj6OFqX3sZ5YSRJ&usp=drive_copy',
            'https://drive.google.com/open?id=1HkQAmKG7P4kcipLQQuDYIa_iHwb8hucs&usp=drive_copy',
            'https://drive.google.com/open?id=1NPzW_tvDdJd6qiPrFe_i7Y-zVnyuXhbQ&usp=drive_copy',
            'https://drive.google.com/open?id=1Sr4JSp3zYVmxcNsMJi6sV1odv41j2bQ-&usp=drive_copy',
            'https://drive.google.com/open?id=163CtMlxkShziUXmz2ipqFj6xURGrnp_S&usp=drive_copy',
            'https://drive.google.com/open?id=17qRb_UM8fZcG5bMBRQX8txbvGRLS5fbu&usp=drive_copy',
            'https://drive.google.com/open?id=1oLBO60vSzJ1MeoAIUprjXuS2_ZFAGseu&usp=drive_copy',
            'https://drive.google.com/open?id=1MAoakMgDElzPNfjm73aAkL2RhNPHQUY4&usp=drive_copy',
            'https://drive.google.com/open?id=17zjCxrRnM2X_OuLu-eI0qTkcQN-aj9O8&usp=drive_copy',
            'https://drive.google.com/open?id=19fCudg7i1r-91LEQvHTg7D1ZSz9KZ9rv&usp=drive_copy',
            'https://drive.google.com/open?id=1jD8eEa5sMFEmcBIn7Ug31cCdhExZZ_Zx&usp=drive_copy',
            'https://drive.google.com/open?id=1EdYJKfQnUnYZNdgBbburpRql7N4gjPcw&usp=drive_copy',
            'https://drive.google.com/open?id=1YILRrS2N3vvUpk4VN94U8dAoM4Zrc3Dy&usp=drive_copy',
            'https://drive.google.com/open?id=1xEOTdDgcfPCltY--vpsbm0P6Rx-oEndD&usp=drive_copy',
            'https://drive.google.com/open?id=1etBM2nEg7RTXWuah9VYCFenLNBRrrDxw&usp=drive_copy',
            'https://drive.google.com/open?id=1sW7RL20FjiIeOEUJQ5U9O2sXKiE8HsGv&usp=drive_copy',
            'https://drive.google.com/open?id=1xlDw_Mnuhj1AC69gQ8b8StcrAMzxUD18&usp=drive_copy',
            'https://drive.google.com/open?id=13oYNuxFZAL278rmmZIOqFY0ke6fMQThk&usp=drive_copy',
            'https://drive.google.com/open?id=1mQKPtx7KUS1yMVOB7p5ND0kg6_aYA-Yi&usp=drive_copy',
            'https://drive.google.com/open?id=1PeXzP9whpCcjXyp0p6n4e7h3_ta1WR7Z&usp=drive_copy',
            'https://drive.google.com/open?id=1ICm64OpBX6g_WYEEh8lT6fcnNBiE1JBm&usp=drive_copy',
            'https://drive.google.com/open?id=1xeYr2g7RyF-HH91vbMw5NGSGWot0QFEe&usp=drive_copy'
        ];

        // Nomes dos arquivos na ordem fornecida
        const nomes = [
            'SIS-2013-Etapa-I-Gabarito.pdf',
            'SIS-2013-Etapa-I-Prova.pdf',
            'SIS-2014-Etapa-I-Gabarito.pdf',
            'SIS-2014-Etapa-I-Prova.pdf',
            'SIS-2015-Etapa-I-Gabarito.pdf',
            'SIS-2015-Etapa-I-Prova.pdf',
            'SIS-2016-Etapa-I-Gabarito.pdf',
            'SIS-2016-Etapa-I-Prova.pdf',
            'SIS-2017-Etapa-I-Gabarito.pdf',
            'SIS-2017-Etapa-I-Prova.pdf',
            'SIS-2018-Etapa-I-Gabarito.pdf',
            'SIS-2018-Etapa-I-Prova.pdf',
            'SIS-2019-Etapa-I-Gabarito.pdf',
            'SIS-2019-Etapa-I-Prova.pdf',
            'SIS-2020-Etapa-I-Gabarito.pdf',
            'SIS-2020-Etapa-I-Prova.pdf',
            'SIS-2021-Etapa-I-Gabarito.pdf',
            'SIS-2021-Etapa-I-Prova.pdf',
            'SIS-2022-Etapa-I-Gabarito.pdf',
            'SIS-2022-Etapa-I-Prova.pdf',
            'SIS-I-2023-Gabarito.pdf',
            'SIS-I-2023-Prova.pdf',
            'SIS-I-2024-Gabarito.pdf',
            'SIS-I-2024-Prova.pdf'
        ];

        // Organizar por ano (pares são gabaritos, ímpares são provas)
        const provas = [];
        for (let i = 0; i < nomes.length; i += 2) {
            const nomeGabarito = nomes[i];
            const nomeProva = nomes[i + 1];
            const ano = this.extractAnoFromNome(nomeGabarito || nomeProva);
            
            provas.push({
                ano: ano,
                etapa: 'I',
                gabarito: {
                    nome: nomeGabarito,
                    link: links[i]
                },
                prova: {
                    nome: nomeProva,
                    link: links[i + 1]
                }
            });
        }

        return provas;
    }

    getSISProvasII() {
        // Links fornecidos para SIS II
        const links = [
            'https://drive.google.com/file/d/12Kql28koUl1PfcwYJuITKvSwpdddPfEn/view?usp=drive_link',
            'https://drive.google.com/file/d/1IMQtaQ-11zZUncg-D-ETykn49yFc27j_/view?usp=drive_link',
            'https://drive.google.com/file/d/1GH-eJiGw-bekAcp4FjN1DqN9SGl_eqLz/view?usp=drive_link',
            'https://drive.google.com/file/d/19JZuuqI66KV_BxPs8HBE5iYmkXixsSCX/view?usp=drive_link',
            'https://drive.google.com/file/d/1coA0DiWBBnaLQjfuF_aqta7idi4keRas/view?usp=drive_link',
            'https://drive.google.com/file/d/1s4D3yaTSWREJX3YLw_z6LCPus2BGy98n/view?usp=drive_link',
            'https://drive.google.com/file/d/1ksfPg0oheyqep0kSnWKeuS1qAldu30-L/view?usp=drive_link',
            'https://drive.google.com/file/d/186te2WcEKF-hwLcA-3iABfRZBGWdTT4t/view?usp=drive_link',
            'https://drive.google.com/file/d/1yVI4QrDoFSvyH_vAHxYlORfJla4JuqDE/view?usp=drive_link',
            'https://drive.google.com/file/d/1fBJO1q6ia2OoQb9Zrqhj6r7tmYnGJi7Y/view?usp=drive_link',
            'https://drive.google.com/file/d/1PPW2T4_gXzAHc28_20EqNfywo48tLBDV/view?usp=drive_link',
            'https://drive.google.com/file/d/16NmBJkLPQPfIl-FhCe-qn-WIrvuYMOh2/view?usp=drive_link',
            'https://drive.google.com/file/d/1bV-PDPNL_pojqxetRKhXh22_Qr4xxa7C/view?usp=drive_link',
            'https://drive.google.com/file/d/19r3LBImVKBGuEYTHY3w3EjntYh4Q_ADO/view?usp=drive_link',
            'https://drive.google.com/file/d/1QnA4cR120g3E-Gjg55hHytdGAloLTS1O/view?usp=drive_link',
            'https://drive.google.com/file/d/1Bk-gTE5y0tg5Z4du9J9yePLyfwrZO8ki/view?usp=drive_link',
            'https://drive.google.com/file/d/1IdXwkcNlZkh_RaVz6F_roi59KD_47jpo/view?usp=drive_link',
            'https://drive.google.com/file/d/1YjmocpSHoC5UsPLrZJj_uvfQDnMwY7jH/view?usp=drive_link',
            'https://drive.google.com/file/d/1DMtUIGmLWPdncVqn6uXr8jF25d-ErOHa/view?usp=drive_link',
            'https://drive.google.com/file/d/121Lgee_0IQSuiJVdAQlTFliupxeRH1Sl/view?usp=drive_link',
            'https://drive.google.com/file/d/1v9Te2x213u5f1fSSeHg9UQoAKR954eYl/view?usp=drive_link',
            'https://drive.google.com/file/d/1IA8UY4VGhR9yhysNbM_I-hCcNjet6X8j/view?usp=drive_link',
            'https://drive.google.com/file/d/13_nV7AYAcb4IARH_FKR-ioTUmhXYKZV5/view?usp=drive_link',
            'https://drive.google.com/file/d/1H8ZX-Kz9vF0vyJ2D_KHJlhJw_yQmtReD/view?usp=drive_link'
        ];

        // Nomes dos arquivos (precisaríamos dos nomes exatos, mas vou criar baseado no padrão)
        // Como não temos os nomes exatos, vou criar um array organizado
        const provas = [
            { ano: '2013', etapa: 'II' },
            { ano: '2014', etapa: 'II' },
            { ano: '2015', etapa: 'II' },
            { ano: '2023', etapa: 'II' },
            { ano: '2024', etapa: 'II' },
            { ano: '2016', etapa: 'II' },
            { ano: '2017', etapa: 'II' },
            { ano: '2018', etapa: 'II' },
            { ano: '2019', etapa: 'II' },
            { ano: '2020', etapa: 'II' },
            { ano: '2021', etapa: 'II' },
            { ano: '2022', etapa: 'II' }
        ];

        // Atribuir links (2 por ano: gabarito e prova)
        let linkIndex = 0;
        provas.forEach(prova => {
            prova.gabarito = {
                nome: `SIS-${prova.ano}-Etapa-${prova.etapa}-Gabarito.pdf`,
                link: links[linkIndex++]
            };
            prova.prova = {
                nome: `SIS-${prova.ano}-Etapa-${prova.etapa}-Prova.pdf`,
                link: links[linkIndex++]
            };
        });

        return provas;
    }

    getSISProvasIII() {
        // Links fornecidos para SIS III
        const links = [
            'https://drive.google.com/file/d/1HVsIR1i8_IcNjqxRKa3Vsak3IlUmx1ae/view?usp=drive_link',
            'https://drive.google.com/file/d/1iG-XcfthDGduE0gdvDmlThIbTRm3sPO3/view?usp=drive_link',
            'https://drive.google.com/file/d/1e0dTRkPxelb8UEHMnWfm8qQdJj1zREw1/view?usp=drive_link',
            'https://drive.google.com/file/d/12PAZahcyGP1VSG6f6c6AtyXQGq7kEnub/view?usp=drive_link',
            'https://drive.google.com/file/d/1Xz85EtyIchIVeLJ4NlIoOyA9YJe1kuTT/view?usp=drive_link',
            'https://drive.google.com/file/d/1R5AtIm9-OjNqjnlK_Hm7CvMhnblcaQuj/view?usp=drive_link',
            'https://drive.google.com/file/d/1IPmjt_Lw7h2TxzWKHKUPVtnVTEq7cktH/view?usp=drive_link',
            'https://drive.google.com/file/d/1p_FBEMRDQutguNwejFZtHiqUaWkY6zSx/view?usp=drive_link',
            'https://drive.google.com/file/d/1kiPbaQe27djMZjIxJ1d_b8-CVQ9A-wID/view?usp=drive_link',
            'https://drive.google.com/file/d/1NcPswT3i-fvw_j1JsbtUxb5EqJw81_78/view?usp=drive_link',
            'https://drive.google.com/file/d/1QFExxNFmiJv290muSoQ4lIIgw1eENSSK/view?usp=drive_link',
            'https://drive.google.com/file/d/1NcoIrAEkkXZpoxv08PIfFlHZOv6D97qg/view?usp=drive_link',
            'https://drive.google.com/file/d/1svIBziK9usITdPyyjyewVfcyvVyccQ7L/view?usp=drive_link',
            'https://drive.google.com/file/d/1ujCDj-ZbdVdgCnCM1UDKNktjoH2epmh3/view?usp=drive_link',
            'https://drive.google.com/file/d/1TCbLVJiT18LDOhZ9dF5zgu-ydF8LgVNl/view?usp=drive_link',
            'https://drive.google.com/file/d/1UUmRtxEOorTexaRjTo_7VOQtEp6cw7Oe/view?usp=drive_link',
            'https://drive.google.com/file/d/1YJEnV1fRINPmXVVEyhp7Mv4iaLoEUCLT/view?usp=drive_link',
            'https://drive.google.com/file/d/1swSeNX5BAQH40VakQR07utum1fi5gsOl/view?usp=drive_link',
            'https://drive.google.com/file/d/1RwYc1NH5p26Tov0fTHG_YIbC6gqeeqB1/view?usp=drive_link',
            'https://drive.google.com/file/d/1FulKu8lFLn6pAYJNMulevtbEmQAJJ0xm/view?usp=drive_link',
            'https://drive.google.com/file/d/1xNDryKbhuq0EtAxpK-hPrk8l3k84-5PH/view?usp=drive_link',
            'https://drive.google.com/file/d/16yHAV_pDAvvgF7CqZljd13cYs6IRasTW/view?usp=drive_link',
            'https://drive.google.com/file/d/1jeOzK0zJxJTewB-6uobtGCRsTxSAwe3Q/view?usp=drive_link',
            'https://drive.google.com/file/d/1rDbp6W_tUlx5SneyO4BAKoeU6HD6Vhze/view?usp=drive_link'
        ];

        // Criar array de provas com anos de 2013 a 2024
        const provas = [];
        const anos = ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
        
        let linkIndex = 0;
        anos.forEach(ano => {
            provas.push({
                ano: ano,
                etapa: 'III',
                gabarito: {
                    nome: `SIS-${ano}-Etapa-III-Gabarito.pdf`,
                    link: links[linkIndex++]
                },
                prova: {
                    nome: `SIS-${ano}-Etapa-III-Prova.pdf`,
                    link: links[linkIndex++]
                }
            });
        });

        return provas;
    }

    extractAnoFromNome(nome) {
        // Extrai o ano do nome do arquivo
        const match = nome.match(/\b(20\d{2})\b/);
        return match ? match[1] : 'N/A';
    }

    showSISProvas() {
        const provas = this.provasData.sis[this.currentEtapa];
        const grid = document.getElementById('provasGrid');
        const noProvas = document.getElementById('noProvas');

        if (!provas || provas.length === 0) {
            grid.innerHTML = '';
            noProvas.classList.add('active');
            return;
        }

        noProvas.classList.remove('active');
        grid.innerHTML = '';

        // Ordenar provas por ano (mais recente primeiro)
        const provasOrdenadas = [...provas].sort((a, b) => b.ano - a.ano);

        provasOrdenadas.forEach(prova => {
            const card = this.createProvaCard(prova);
            grid.appendChild(card);
        });

        this.updateStats();
    }

    createProvaCard(prova) {
        const card = document.createElement('div');
        card.className = 'prova-card';

        // Converter etapa romana para número
        const etapaNum = prova.etapa === 'I' ? 'i' : prova.etapa === 'II' ? 'ii' : 'iii';
        
        card.innerHTML = `
            <div class="prova-header">
                <span class="prova-ano">${prova.ano}</span>
                <span class="prova-etapa">Etapa ${prova.etapa}</span>
            </div>
            <h3 class="prova-titulo">
                <i class="fas fa-file-pdf"></i>
                SIS ${prova.ano} - Etapa ${prova.etapa}
            </h3>
            <div class="prova-botoes">
                <a href="${prova.prova.link}" 
                   target="_blank" 
                   class="btn-prova"
                   title="Baixar Prova">
                    <i class="fas fa-download"></i>
                    Prova
                </a>
                <a href="${prova.gabarito.link}" 
                   target="_blank" 
                   class="btn-gabarito"
                   title="Baixar Gabarito">
                    <i class="fas fa-check-circle"></i>
                    Gabarito
                </a>
            </div>
        `;

        return card;
    }

    clearProvasGrid() {
        const grid = document.getElementById('provasGrid');
        grid.innerHTML = '';
    }

    updateStats() {
        // Calcular estatísticas baseadas nas provas SIS
        let totalProvas = 0;
        const anosSet = new Set();

        // Somar todas as provas SIS
        Object.values(this.provasData.sis).forEach(etapaProvas => {
            totalProvas += etapaProvas.length * 2; // Cada ano tem prova e gabarito
            etapaProvas.forEach(prova => {
                anosSet.add(prova.ano);
            });
        });

        // Atualizar elementos
        document.getElementById('totalProvas').textContent = totalProvas;
        document.getElementById('totalAnos').textContent = anosSet.size;
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const bancoDeProvas = new BancoDeProvas();
});