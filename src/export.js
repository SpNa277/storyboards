const VERSION = "3.1";
const ADO_VERSION = "5.1";
const ID = "storyboard";
const SCENE_NAME = "scene";
const FILENAME = "storyboard.xml";

export function exportFigures(figures) {
  const doc = generateXML(figures);
  const xmlStr = new XMLSerializer().serializeToString(doc);

  const a = document.createElement("a");
  const blob = new Blob([xmlStr], { type: "application/xml" });

  a.href = URL.createObjectURL(blob);
  a.download = FILENAME;
  a.click();

  URL.revokeObjectURL(a.href);
}

export function generateXML(scenes) {
  const doc = document.implementation.createDocument("", "", null);
  const docType = document.implementation.createDocumentType(
    "ADOXML",
    "",
    "adoxml31.dtd"
  );
  doc.appendChild(docType);

  const date = new Date();
  const adoxml = doc.createElement("ADOXML");
  adoxml.setAttribute("version", VERSION);
  adoxml.setAttribute(
    "date",
    `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`
  );
  adoxml.setAttribute("time", `${date.getHours()}:${date.getMinutes()}`);
  adoxml.setAttribute("adoversion", `Version ${ADO_VERSION}`);
  doc.appendChild(adoxml);

  const models = doc.createElement("MODELS");

  let m = 0;
  let i = 0;
  for (const figures of scenes) {
    m += 1;
    const model = doc.createElement("MODEL");
    model.setAttribute("id", `${ID}_${m}`);
    model.setAttribute("name", `${SCENE_NAME} ${m}`);
    model.setAttribute("version", "");
    model.setAttribute("modeltype", "Scene");
    model.setAttribute("libtype", "bp");
    model.setAttribute("applib", "Scene2Model Dynamic v1.5.2");

    //created element is empty, all the info isn't needed, but the tag is required
    const modelattributes = doc.createElement("MODELATTRIBUTES");
    model.appendChild(modelattributes);

    for (const figure of figures) {
      i += 1;
      const instance = doc.createElement("INSTANCE");
      instance.setAttribute("id", `${figure.class}-${i}`);
      instance.setAttribute("class", figure.class);
      instance.setAttribute("name", `${figure.name} ${i}`);
      const position = doc.createElement("ATTRIBUTE");
      position.setAttribute("name", "Position");
      position.setAttribute("type", "STRING");
      // scale coordinates to A4 (210mm x 297mm)
      position.textContent = `NODE x:${21 * figure.position.x}cm y:${
        29.7 * (1 - figure.position.y)
      }cm w:${figure.scale.x}cm h:${figure.scale.y}cm index:1`;
      instance.appendChild(position);

      const type = doc.createElement("ATTRIBUTE");
      type.setAttribute("name", "Type");
      type.setAttribute("type", "ENUMERATION");
      type.textContent = figure.type;
      instance.appendChild(type);

      model.appendChild(instance);
      models.appendChild(model);
    }
  }
  adoxml.appendChild(models);

  return doc;
}
