const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

const montarObjetoEnderecos = require('./montarObjetoEnderecos.js');

module.exports = {
    ObterEnderecosDiferencial: async function () {
        let enderecos = montarObjetoEnderecos.MontarObjetoEnderecos();
        let enderecosConsultados = [];
        let enderecosDiferencial = [];

        console.log("Obtendo o Diferencial entre os Endereços Encontrados e Não Encontrados na Última Consulta\r\n");

        if (fs.existsSync(__dirname + "/enderecosDiferencial.txt")) {
            fs.rm(__dirname + "/enderecosDiferencial.txt");
        }

        if (fs.existsSync(__dirname + "/enderecos.txt")) {
            const fileStream = fs.createReadStream(__dirname + "/enderecos.txt");
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity,
                terminal: false
            });

            for await (const linha of rl) {
                if (linha.length > 0) {
                    let endereco = linha.replace('(', '').replace(')', '').replace(/,\s+/g, ',').replace(/([a-zâãäåæçèéêëìíîïðñòóôõøùúûüýþÿı \-\dº]+)(?:'')([a-zâãäåæçèéêëìíîïðñòóôõøùúûüýþÿı \-\dº]+)/gi, '$1@$2').replace(/\'{1}/g, '').replace('@', '\'').trimEnd().split(',');
                    endereco = endereco.splice(0, endereco.length - 1);
                    let enderecoObj = {
                        Regiao: endereco[0],
                        UF: endereco[1],
                        Estado: endereco[2],
                        Bairro: endereco[3],
                        Cidade: endereco[4],
                        Sigla: endereco[5],
                        Faixa: endereco[6]
                    };
                    enderecosConsultados.push(enderecoObj);
                }
            }
        } else {
            console.log("Os endereços não foram consultados ainda visto que o arquivo de saída 'enderecos.txt' ainda não foi gerado. Favor realizar a consulta primeiro");
        }

        for (let endereco of enderecos) {
            let enderecoEncontrado = false;

            enderecosConsultados.some((enderecoConsultado) => {
                if (this.CompararIgualdadeObjetos(endereco, enderecoConsultado)) {
                    enderecoEncontrado = true;
                    return true;
                }
            });

            if (!enderecoEncontrado) {
                if (!fs.existsSync(__dirname + "/enderecosDiferencial.txt")) {
                    fs.writeFileSync(__dirname + "/enderecosDiferencial.txt", `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '', ''), \r\n`);
                } else {
                    fs.appendFileSync(__dirname + "/enderecosDiferencial.txt", `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '', ''), \r\n`);
                }

                console.log("enderecosDiferencial", `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '', '')`);
                enderecosDiferencial.push(endereco);
            }
        }

        console.log("Total de Endereços não Encontrados: " + enderecosDiferencial.length);
    },

    VerificarObjeto: function (objeto) {
        return objeto !== null && typeof objeto === 'object';
    },

    CompararIgualdadeObjetos: function (objeto1, objeto2) {
        if (!this.VerificarObjeto(objeto1) || !this.VerificarObjeto(objeto2)) {
            return false;
        }

        const chaves1 = Object.keys(objeto1);
        const chaves2 = Object.keys(objeto2);

        if (chaves1.length != chaves2.length) {
            // console.log("O comprimento das chaves " + chaves1 + " era diferente do comprimento das chaves " + chaves2);
            return false;
        }

        for (let chave of chaves1) {
            if (!objeto2.hasOwnProperty(chave)) {
                // console.log("O objeto " + objeto2 + " não tinha a propriedade " + chave);
                return false;
            }

            let valor1 = objeto1[chave];
            let valor2 = objeto2[chave];
            let saoObjetos = this.VerificarObjeto(valor1) && this.VerificarObjeto(valor2);

            if (saoObjetos && !this.CompararIgualdadeObjetos(valor1, valor2) || !saoObjetos && valor1 !== valor2) {
                // console.log("O valor " + valor1 + " da propriedade " + chave + " era diferente do valor " + valor2);
                return false;
            }
        }

        return true;
    },

    ConsultarFaixasCEP: async function () {
        var enderecos = montarObjetoEnderecos.MontarObjetoEnderecos();

        console.log("Consultando as Faixas de CEP das Localidades...\r\n");

        let ultimoEnderecoConsultado = "";
        let enderecoIndiceInicial = null;

        try {
            for (let endereco of enderecos) {
                if (fs.existsSync(__dirname + '/enderecos.txt') && ultimoEnderecoConsultado === "") {
                    const fileStream = fs.createReadStream(__dirname + '/enderecos.txt');
                    const rl = readline.createInterface({
                        input: fileStream,
                        crlfDelay: Infinity,
                        terminal: false
                    });

                    for await (const linha of rl) {
                        if (linha.length > 0) {
                            ultimoEnderecoConsultado = linha;
                        }
                    }

                    // console.log("ultimoEnderecoConsultado", ultimoEnderecoConsultado);

                    ultimoEnderecoConsultado = ultimoEnderecoConsultado.replace('(', '').replace(')', '').replace(/,\s+/g, ',').replace(/([a-zâãäåæçèéêëìíîïðñòóôõøùúûüýþÿı \-\dº]+)(?:'')([a-zâãäåæçèéêëìíîïðñòóôõøùúûüýþÿı \-\dº]+)/gi, '$1@$2').replace(/\'{1}/g, '').replace('@', '\'').trimEnd().split(',');
                    ultimoEnderecoConsultado = ultimoEnderecoConsultado.splice(0, ultimoEnderecoConsultado.length - 1);

                    // console.log("ultimoEnderecoConsultado", ultimoEnderecoConsultado + "\r\n");
                }

                if (ultimoEnderecoConsultado !== "" && enderecoIndiceInicial == null) {
                    if (endereco.UF == ultimoEnderecoConsultado[1] && endereco.Bairro == ultimoEnderecoConsultado[3] && endereco.Cidade == ultimoEnderecoConsultado[4]) {
                        enderecoIndiceInicial = enderecos.indexOf(endereco);
                        // console.log("enderecoIndiceInicial", enderecoIndiceInicial);
                        break;
                    } else {
                        continue;
                    }
                }
            }

            if (ultimoEnderecoConsultado !== "" && enderecoIndiceInicial == null) {
                console.log("Houve um erro ao obter o último endereço consultado. Favor verificar a lógica da aplicação");
                console.log("ultimoEnderecoConsultado", ultimoEnderecoConsultado);
                return;
            }

            if (enderecoIndiceInicial == enderecos.length - 1) {
                console.log("Todos as Faixas de CEP já foram consultadas anteriormente.\r\nSe desejar executar uma nova consulta, apague o arquivo de retorno 'enderecos.txt' e execute a rotina novamente\r\n");
            }

            for (let endereco of enderecos) {
                if (enderecoIndiceInicial != null && enderecos.indexOf(endereco) <= enderecoIndiceInicial) {
                    continue;
                }

                if (endereco.Bairro == "") {
                    await axios.get(`https://buscacepinter.correios.com.br/app/faixa_cep_uf_localidade/carrega-faixa-cep-uf-localidade.php?uf=${endereco.UF}&localidade=${encodeURI(endereco.Cidade)}`,
                        { timeout: 2000 }).then((response) => {
                            if (response.data.dados && response.data.dados.length) {

                                for (let dado of response.data.dados) {
                                    if (dado.faixasCep && dado.faixasCep.length) {

                                        for (let faixaCep of dado.faixasCep) {
                                            endereco.CepInicial = faixaCep.cepInicial;
                                            endereco.CepFinal = faixaCep.cepFinal;

                                            // Existem faixas de CEP apenas para a porção urbana da cidade
                                            // Essa condição existe para garantir que a faixa de CEP total da cidade será usada
                                            if (!faixaCep.tipo || faixaCep.tipo == "T") {
                                                if (!fs.existsSync(__dirname + '/enderecos.txt')) {
                                                    fs.writeFileSync(__dirname + '/enderecos.txt', `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '${endereco.CepInicial}', '${endereco.CepFinal}'), \r\n`);
                                                } else {
                                                    fs.appendFileSync(__dirname + '/enderecos.txt', `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '${endereco.CepInicial}', '${endereco.CepFinal}'), \r\n`);
                                                }

                                                console.log("enderecoRecebido", `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '${endereco.CepInicial}', '${endereco.CepFinal}')`);
                                            } else {
                                                continue;
                                            }
                                        }
                                    }
                                }
                            } else if (response.data.mensagem) {
                                if (!fs.existsSync(__dirname + '/enderecosNaoEncontrados.txt')) {
                                    fs.writeFileSync(__dirname + '/enderecosNaoEncontrados.txt', `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '', '') - ${response.data.mensagem}\r\n`);
                                } else {
                                    fs.appendFileSync(__dirname + '/enderecosNaoEncontrados.txt', `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '', '') - ${response.data.mensagem}\r\n`);
                                }

                                console.log("\r\nenderecoNaoEncontrado", `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '', '') - ${response.data.mensagem}`);
                            }
                        }).catch((error) => {
                            console.log("Houve um erro ao consultar as Faixas de CEP dos Endereços");
                            console.error(error + "\r\n");
                            throw error;
                        });
                } else {
                    await axios.get(`https://buscacepinter.correios.com.br/app/logradouro_bairro/carrega-logradouro-bairro.php?uf=${endereco.UF}&localidade=${encodeURI(endereco.Cidade)}&bairro=${encodeURI(endereco.Bairro)}`,
                        { timeout: 2000 }).then((response) => {
                            if (response.data.dados && response.data.dados.length) {

                                for (let dado of response.data.dados) {
                                    let indiceDado = response.data.dados.indexOf(dado);

                                    if (dado.cep) {
                                        if (indiceDado == 0) {
                                            endereco.CepInicial = dado.cep;
                                        }

                                        if (indiceDado == response.data.dados.length - 1) {
                                            endereco.CepFinal = dado.cep;
                                        }
                                    }
                                }

                                if (!fs.existsSync(__dirname + '/enderecos.txt')) {
                                    fs.writeFileSync(__dirname + '/enderecos.txt', `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '${endereco.CepInicial}', '${endereco.CepFinal}'), \r\n`);
                                } else {
                                    fs.appendFileSync(__dirname + '/enderecos.txt', `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '${endereco.CepInicial}', '${endereco.CepFinal}'), \r\n`);
                                }

                                console.log("enderecoRecebido", `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '${endereco.CepInicial}', '${endereco.CepFinal}')`);
                            } else if (response.data.mensagem) {
                                if (!fs.existsSync(__dirname + '/enderecosNaoEncontrados.txt')) {
                                    fs.writeFileSync(__dirname + '/enderecosNaoEncontrados.txt', `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '', '') - ${response.data.mensagem}\r\n`);
                                } else {
                                    fs.appendFileSync(__dirname + '/enderecosNaoEncontrados.txt', `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '', '') - ${response.data.mensagem}\r\n`);
                                }

                                console.log("\r\nenderecoNaoEncontrado", `('${endereco.Regiao}', '${endereco.UF}', '${endereco.Estado}', '${endereco.Bairro.replace('\'', '\'\'')}', '${endereco.Cidade.replace('\'', '\'\'')}', '${endereco.Sigla}', '${endereco.Faixa}', '', '') - ${response.data.mensagem}`);
                            }
                        }).catch((error) => {
                            console.log("Houve um erro ao consultar as Faixas de CEP dos Endereços");
                            console.error(error + "\r\n");
                            throw error;
                        });
                }
            }
        } catch (error) {
            console.log("Executando uma nova tentativa de Consulta\r\n");
            return this.ConsultarFaixasCEP();
        }

        console.log("Consulta das Faixas de CEP das Localidades concluída\r\n");
    }
};

if (!fs.existsSync(__dirname + "/enderecos.txt")) {
    module.exports.ConsultarFaixasCEP();
} else {
    module.exports.ObterEnderecosDiferencial();
}