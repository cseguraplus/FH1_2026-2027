const ingredients = [
  ["Bifidobacterium lactis", "Probiótico para una propuesta centrada en la microbiota intestinal."],
  ["Inulina de agave", "Fibra prebiótica que sirve de alimento a bacterias benéficas del intestino."],
  ["Cycloastragenol", "Compuesto del astrágalo estudiado en la ciencia de la telomerasa y los telómeros."],
  ["Quercetina", "Flavonoide investigado por su actividad antioxidante y su relación con la respuesta inflamatoria."],
  ["Espermidina", "Compuesto estudiado por su papel en la autofagia, el proceso de reciclaje celular."],
  ["Glicinato de magnesio", "Aporta magnesio, mineral esencial para la función normal del sistema nervioso y muscular."],
];

export function ProductOverview() {
  return <>
    <section className="panel product-panel">
      <div className="product-identity">
        <span className="product-production"><span aria-hidden="true" />Primer lote en producción</span>
        <img className="product-photo" src="/brand/fh1.png" alt="Envase verde de FH1, fórmula en polvo de F Health" width={1254} height={1254}/>
        <span className="eyebrow">LA FÓRMULA QUE NOS UNE</span>
        <h2>FH1</h2>
        <p>Suplemento alimenticio en polvo · 30 tomas</p>
        <div className="product-signature">6 ingredientes. Una sola rutina.</div>
      </div>
      <div className="product-details">
        <p className="eyebrow">NUTRICIÓN PREMIUM · TODO EN UNO</p>
        <h2>Una fórmula con identidad propia.</h2>
        <p className="product-intro">FH1 reúne probiótico, fibra prebiótica, compuestos de interés en salud celular y magnesio en un solo formato. Una propuesta integral para hacer del bienestar parte de tu día.</p>
        <ul>{ingredients.map(([name,role],n)=><li key={name}><span className="ingredient-number">{String(n+1).padStart(2,"0")}</span><div><strong>{name}</strong><p>{role}</p></div></li>)}</ul>
        <div className="product-price"><span>Precio público de la red</span><strong>$2,500 <small>MXN</small></strong><p>Por bote · 30 tomas · Impuestos y envío nacional incluidos en esta etapa.</p><p className="product-daily">$83.33 por toma · Todo en un solo bote.</p></div>
      </div>
    </section>
    <section className="product-science" aria-labelledby="product-science-title">
      <div className="section-top"><div><span className="eyebrow">BIENESTAR DESDE ADENTRO</span><h2 id="product-science-title">La ciencia que inspira FH1.</h2></div></div>
      <div className="product-science-grid">
        <article className="panel"><span className="eyebrow">MICROBIOTA Y DIGESTIÓN</span><h3>El bienestar empieza en el interior.</h3><p>Bifidobacterium lactis e inulina de agave reúnen un probiótico y una fibra prebiótica en nuestra propuesta de nutrición digestiva.</p></article>
        <article className="panel"><span className="eyebrow">SALUD CELULAR</span><h3>Una mirada a la longevidad.</h3><p>Cycloastragenol y espermidina conectan la fórmula con dos áreas de investigación: telómeros y autofagia. La senescencia celular también forma parte del campo científico que inspira esta visión.</p></article>
        <article className="panel"><span className="eyebrow">ANTIOXIDANTES Y SISTEMA NERVIOSO</span><h3>Una perspectiva integral.</h3><p>Quercetina, estudiada en estrés oxidativo y respuesta inflamatoria, junto con magnesio, que participa en la función nerviosa y muscular normal.</p></article>
      </div>
      <p className="section-note">Los estudios de ingredientes no equivalen a resultados clínicos de FH1. Este producto es un suplemento alimenticio, no un medicamento.</p>
    </section>
  </>;
}
