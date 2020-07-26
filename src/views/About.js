import React from 'react';
import { 
    FaFacebookF, 
    FaInstagram, 
    FaLinkedinIn, 
    FaTwitter, 
    FaPhoneAlt,
    FaRegEnvelope } 
from 'react-icons/fa';

const AboutList = (props) => {
    return (
        props.title ?
            <div className="about__details">
                <h2 className="about__title">
                    {props.title}
                </h2>
                {props.title ?
                    <div className="about__content">
                        <ul className="about__list">
                            { 
                                props.list.map(
                                    (t,i) => <li key={i}> {t}{ props.list.length - 1 === i ? '' : '' } </li>
                                )
                            }
                        </ul>
                    </div>
                : ''}
            </div>
        : 'Please provide block title'
    )
} 

function About(){
    return(
        <div className="about">
            <div className="about__sidebar">

                <div className="about__name">
                    <h1 className="about__name-lg">
                        John Clark <span className="about__name-sm">Semblante</span>
                    </h1>
                </div>

                <div className="about__img" />
                
                <div className="about__details">
                    <h2 className="about__title">
                       About Me: 
                    </h2>
                    <div className="about__content">
                        <p>
                            I am a web developer for almost 5 years now. I mainly do front end web developments. Also aside from being
                            a web developer, I mostly spend my time travelling as a sort of distressing.
                        </p>
                    </div>
                </div>
                
                <div className="about__details">
                    <h2 className="about__title">
                       Contact Us: 
                    </h2>
                    <div className="about__content">
                        <ul className="about__social">
                            <li>
                                <a className="about__social-media" rel="noopener noreferrer" href="https://www.facebook.com/johnmsemblante" target="_blank">
                                    <FaFacebookF /> https://www.facebook.com/johnmsemblante
                                </a>
                            </li>
                            <li>
                                <a className="about__social-media" rel="noopener noreferrer" href="https://www.instagram.com/johnsemblante/" target="_blank">
                                    <FaInstagram /> https://www.instagram.com/johnsemblante/
                                </a>
                            </li>
                            <li>
                                <a className="about__social-media" rel="noopener noreferrer" href="https://www.linkedin.com/in/johnsemblante/" target="_blank">
                                    <FaLinkedinIn /> https://www.linkedin.com/in/johnsemblante/
                                </a>
                            </li>
                            <li>
                                <a className="about__social-media" rel="noopener noreferrer" href="https://twitter.com/johnmsemblante" target="_blank">
                                    <FaTwitter /> https://twitter.com/johnmsemblante
                                </a>
                            </li>
                            <li>
                                <a className="about__social-media" href="tel:09770928769">
                                    <FaPhoneAlt /> 09770928769
                                </a>
                            </li>
                            <li>
                                <a className="about__social-media" href="mailto:johnmsemblante@gmail.com">
                                    <FaRegEnvelope /> johnmsemblante@gmail.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="about__main">
                <AboutList
                    title="Skills" 
                    list={[
                        'Wordpress',
                        'Zendesk',
                        'Convert PSD to HTML',
                        'Woocommerce',
                        'Web Designing',
                        'Video Editing'
                    ]} 
                />

                <AboutList 
                    title="Languages" 
                    list={[
                        'HTML',
                        'CSS',
                        'SASS',
                        'LESS',
                        'Javascript',
                        'jQuery',
                        'ReactJs',
                        'PHP'
                    ]} 
                />

                <AboutList 
                    title="Tools" 
                    list={[
                        'Visual Studio Code',
                        'GitBash',
                        'ConEmu',
                        'Powershell',
                        'Notepad++',
                        'Sublime',
                        'Adobe Photoshop',
                        'Adobe Lightroom',
                        'Adobe Premier',
                        'VideoScribe',
                        'Sony Vegas'
                    ]} 
                />
            </div>
        </div>
    )
}

export default About;