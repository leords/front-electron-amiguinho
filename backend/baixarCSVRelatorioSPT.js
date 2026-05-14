import fs from "fs"
import { createObjectCsvStringifier } from "csv-writer"
import { dialog } from "electron"

export default async function baixarCSV(dados) {

    try {

        const csvStringifier = createObjectCsvStringifier({

            // delimitador para excel br, assim a quebra para lacunas acontece automatica
            fieldDelimiter: ";",

            header: [
                { id: "produto", title: "PRODUTO" },
                { id: "quantidade", title: "QUANTIDADE" }
            ]
        })

        const header = csvStringifier.getHeaderString()

        const body = csvStringifier.stringifyRecords(dados)

        const csv = header + body

        // dialog de salvar
        const { filePath } = await dialog.showSaveDialog({
            title: "Salvar relatório CSV",

            defaultPath: "relatorio.csv",

            filters: [
                {
                    name: "CSV",
                    extensions: ["csv"]
                }
            ]
        })

        // cancelou
        if (!filePath) {
            return {
                sucesso: false,
                mensagem: "Usuário cancelou"
            }
        }

        // salva com UTF-8 BOM, sendo assim ele consegue retornar palavras com assentos = ç, ã, é
        fs.writeFileSync(
            filePath,
            "\uFEFF" + csv,
            "utf-8"
        )

        return {
            sucesso: true,
            caminho: filePath
        }

    } catch (error) {

        return {
            sucesso: false,
            mensagem: error.message
        }
    }
}