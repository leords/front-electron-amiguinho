import Cabecalho from '../../componentes/Cabecalho'
import Rodape from '../../componentes/Rodape'
import styles from './styles.module.css'

export default function Dashboard () {
    return (
        <div className={styles.container}>
            <Cabecalho />
            <h1>Dashboard</h1>
            <Rodape />
        </div>
    )
}