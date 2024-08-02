import { Spinner } from './components/spinner/Spinner'
import style from './loading.module.css'

export default function Loading() {
    return (
        <div className={style.container}>
            <Spinner size={50}/>
        </div>
    )
}