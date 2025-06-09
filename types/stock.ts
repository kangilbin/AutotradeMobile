export type StockStatus = {
    ST_CODE: string
    SD_CODE: string
    NAME: string
    DEL_YN: string
}

export type StockResponse = {
    data: StockStatus[];
}