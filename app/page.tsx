import { alegreya, shippori_mincho } from './fonts'
import { Logo } from './components/Logo'
import style from './page.module.css'

export default async function Page() {
    return (
        <div className={style.container}>
            <div>
                <div className={style['first-view']}>
                    <div className={alegreya.className}>
                        <Logo/>
                        <p>Furoku</p>
                        <p className={shippori_mincho.className}>付録</p>
                        <h1>Инструмент для изучения иероглифов</h1>
                    </div>
                </div>
                <div>
                    <section>
                        <h2 className={alegreya.className}>Идея</h2>
                        <p> 
                            Стандартные способы повторения кандзи эффективны, но не так точны: порядок попадающихся иероглифов напрямую не зависит от потребности в повторении: часто встречаешь те, что уже усвоены; 
                            не учитывается 
                        </p>
                        <ul>
                            <li>Насколько хорошо иероглиф вспоминался раньше?</li>
                            <li>Как давно иероглиф был перед глазами?</li>
                            <li>Как часто используется иероглиф?</li>
                        </ul>
                        <p>
                            Опираясь на ответы, furoku <strong>сортирует кандзи (и их сочетания) по срочности повторения</strong>.
                        </p>
                    </section>
                    <section>
                        <h2 className={alegreya.className}>Как использовать сайт</h2>
                        <ol>
                            <li>Чтобы сохранять иероглифы и сочетания, которые хотите повторять, зарегистрируйтесь.</li>
                            <li>Посмотрите в списке иероглифов, какие кандзи или сочетания хотите запомнить.</li>
                            <li>Для повторения перейдите на одноимённую страницу.</li>
                            <li>Периодически проходите тестирование, чтобы на странице повторения были актуальные результаты.</li>
                        </ol>
                    </section>
                    <section>
                        <h2 className={alegreya.className}>Обратная связь</h2>
                        <p>Если есть желание, по адресу ниже можете поделиться любым пользовательским опытом, в т. ч. идеями, жалобами, предложениями.</p>
                    </section>
                </div>
            </div>
        </div>
    )
}