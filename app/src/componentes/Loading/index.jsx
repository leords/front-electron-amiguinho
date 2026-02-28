import styles from './styles.module.css'
import logo from '../../assets/logo-correndo.png'
import { useEffect, useState } from 'react'
import Spinner from '../Spinner/index.jsx'


export default function Loading() {


  const frases = [
    'Sincronizando clientes com segurança e precisão 🔐📋',
    'Atualizando o estoque em tempo real 📦🔄',
    'Configurando o ambiente de vendas 🖥️📊',
    'Finalizando os últimos ajustes do sistema ⚙️✨',
  ]

    const [indice, setIndice] = useState(0)

      useEffect(() => {
        const intervalo = setInterval(() => {
          setIndice((prev) => (prev + 1) % frases.length)
        }, 1750) // troca a cada 2.5s

        return () => clearInterval(intervalo)
      }, [])


    return (
    <div className={styles.loadingContainer}>
      <img 
        src={logo}
        alt="Logo"
        className={styles.logoAnimada}
      />
      <p >{frases[indice]}</p>

      <Spinner />
    </div>
  )
}