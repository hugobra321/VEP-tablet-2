
// Versao de compatibilidade para tablets antigos - evita const/let, arrow functions, template literals e async/await.

var checklistItems = [
  "Insuficiência de colchões",
  "Deficiência do atendimento médico",
  "Insuficiência de medicamentos",
  "Poucas oportunidades de estudo interno",
  "Poucas oportunidades de trabalho com artesanato",
  "Falta de assistência odontológica",
  "Falha no abastecimento de água",
  "Desrespeito aos direitos dos presos indígenas",
  "Ausência de separação de presos LGBTQIA+, indígenas e idosos",
  "Falta de oportunização de leitura",
  "Ausência de fornecimento de uniformes e roupas de cama",
  "Falta de fornecimento de absorventes íntimos",
  "Deficiências na estrutura dos alojamentos dos policiais penais",
  "Falta de plano de prevenção e combate a incêndio",
  "Tempo insuficiente de banho de sol",
  "Baixo efetivo de policiais",
  "Criação de protocolos para reduzir o controle das fações dentro dos presídios",
  "Criação de alas de isolamento para doenças infectocontagiosas",
  "Necessidade de padronização do envio mensal de relatórios sobre remição de pena",
  "Fornecimento de itens de higiene pessoal e higiene das celas",
  "Alimentação em desacordo com o contrato"
];

var humanitarianItems = [
  "Reeducando agredido",
  "Reeducando com atendimento médico/receita médica pendente",
  "Reeducando analfabeto",
  "Reeducanda gestante/lactante",
  "Reeducando há mais de 10 dias em isolamento cautelar"
];

var structuralItems = [
  "Alguma parte da UP com sinal de celular disponível",
  "Câmera de segurança inoperante"
];

function formatDateStr(dateStr) {
  if (!dateStr) return "";
  var parts = dateStr.split("-");
  return parts.length === 3 ? parts[2] + "/" + parts[1] + "/" + parts[0] : dateStr;
}

function getFieldValue(form, name) {
  var el = form.elements[name];
  if (!el) return "";
  if (typeof el.length !== "undefined" && el.tagName !== "SELECT" && el.tagName !== "TEXTAREA" && el.tagName !== "INPUT") {
    return el[0] ? el[0].value : "";
  }
  return el.value || "";
}

function getAllValues(form, name) {
  var result = [];
  var nodes = form.querySelectorAll('[name="' + name + '"]');
  for (var i = 0; i < nodes.length; i++) {
    if ((nodes[i].type === 'checkbox' || nodes[i].type === 'radio') && !nodes[i].checked) continue;
    if (nodes[i].value) result.push(nodes[i].value);
  }
  return result;
}

function getSelectedPhotoFiles() {
  var result = [];
  var inputs = document.querySelectorAll('.foto-input');
  for (var i = 0; i < inputs.length; i++) {
    var files = inputs[i].files;
    if (!files) continue;
    for (var j = 0; j < files.length; j++) result.push(files[j]);
  }
  return result;
}

function collectData() {
  var form = document.getElementById('inspectionForm');
  var data = {};
  var rawDates = getAllValues(form, 'inspection_date[]');
  var formattedDates = [];
  for (var i = 0; i < rawDates.length; i++) formattedDates.push(formatDateStr(rawDates[i]));
  data.inspection_date = formattedDates.join(', ');
  data.prison_unit = getAllValues(form, 'prison_unit[]').join(', ');
  data.fundamento = getFieldValue(form, 'fundamento');
  data.objetivos = getFieldValue(form, 'objetivos');
  data.other_records_presidencia = getFieldValue(form, 'other_records_presidencia');
  data.other_records_direcao = getFieldValue(form, 'other_records_direcao');
  data.other_determinations_choice = getFieldValue(form, 'other_determinations_choice') || 'nao';
  data.other_determinations = getFieldValue(form, 'other_determinations');
  for (i = 0; i < checklistItems.length; i++) data['item_' + (i + 1)] = getFieldValue(form, 'item_' + (i + 1));
  for (i = 0; i < humanitarianItems.length; i++) {
    data['humanitarian_item_' + (i + 1)] = getFieldValue(form, 'humanitarian_item_' + (i + 1));
    data['humanitarian_obs_' + (i + 1)] = getFieldValue(form, 'humanitarian_obs_' + (i + 1));
  }
  for (i = 0; i < structuralItems.length; i++) {
    data['structural_item_' + (i + 1)] = getFieldValue(form, 'structural_item_' + (i + 1));
    data['structural_obs_' + (i + 1)] = getFieldValue(form, 'structural_obs_' + (i + 1));
  }
  try { localStorage.setItem('inspectionData', JSON.stringify(data)); } catch (e) {}
  return data;
}

function readFileAsDataURL(file, onSuccess, onError) {
  var reader = new FileReader();
  reader.onload = function() { onSuccess(reader.result); };
  reader.onerror = function(error) { if (onError) onError(error); };
  reader.readAsDataURL(file);
}

function readFileAsArrayBuffer(file, onSuccess, onError) {
  if (!FileReader.prototype.readAsArrayBuffer) {
    onSuccess(null);
    return;
  }
  var reader = new FileReader();
  reader.onload = function() { onSuccess(reader.result); };
  reader.onerror = function(error) { if (onError) onError(error); };
  reader.readAsArrayBuffer(file);
}

function getExifOrientation(arrayBuffer) {
  if (!arrayBuffer || typeof DataView === 'undefined') return 1;

  var view = new DataView(arrayBuffer);
  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xFFD8) return 1;

  var offset = 2;
  while (offset + 4 < view.byteLength) {
    var marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xFFE1) {
      var app1Length = view.getUint16(offset, false);
      if (offset + app1Length > view.byteLength) return 1;
      if (view.getUint32(offset + 2, false) !== 0x45786966) return 1;

      var tiffOffset = offset + 8;
      var littleEndian = view.getUint16(tiffOffset, false) === 0x4949;
      var firstIFDOffset = view.getUint32(tiffOffset + 4, littleEndian);
      var dirOffset = tiffOffset + firstIFDOffset;
      if (dirOffset + 2 > view.byteLength) return 1;

      var entries = view.getUint16(dirOffset, littleEndian);
      for (var i = 0; i < entries; i++) {
        var entryOffset = dirOffset + 2 + i * 12;
        if (entryOffset + 12 > view.byteLength) return 1;
        if (view.getUint16(entryOffset, littleEndian) === 0x0112) {
          return view.getUint16(entryOffset + 8, littleEndian) || 1;
        }
      }
      return 1;
    }

    if ((marker & 0xFF00) !== 0xFF00) break;
    offset += view.getUint16(offset, false);
  }

  return 1;
}

function getImageFormatFromDataURL(dataUrl) {
  var match = /^data:image\/([a-zA-Z0-9.+-]+);/i.exec(dataUrl || '');
  var type = match && match[1] ? match[1].toLowerCase() : 'jpeg';
  if (type === 'jpg') return 'JPEG';
  if (type === 'jpeg') return 'JPEG';
  if (type === 'png') return 'PNG';
  if (type === 'webp') return 'WEBP';
  return 'JPEG';
}

function fixImageOrientation(dataUrl, orientation, onSuccess, onError) {
  if (!orientation || orientation === 1) {
    onSuccess(dataUrl);
    return;
  }

  var img = new Image();
  img.onload = function() {
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var width = img.width;
      var height = img.height;

      if (orientation > 4) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }

      if (orientation === 2) ctx.transform(-1, 0, 0, 1, width, 0);
      else if (orientation === 3) ctx.transform(-1, 0, 0, -1, width, height);
      else if (orientation === 4) ctx.transform(1, 0, 0, -1, 0, height);
      else if (orientation === 5) ctx.transform(0, 1, 1, 0, 0, 0);
      else if (orientation === 6) ctx.transform(0, 1, -1, 0, height, 0);
      else if (orientation === 7) ctx.transform(0, -1, -1, 0, height, width);
      else if (orientation === 8) ctx.transform(0, -1, 1, 0, 0, width);

      ctx.drawImage(img, 0, 0);
      onSuccess(canvas.toDataURL('image/jpeg', 0.9));
    } catch (e) {
      if (onError) onError(e);
    }
  };
  img.onerror = function(error) { if (onError) onError(error); };
  img.src = dataUrl;
}

function drawJustifiedTextBlock(doc, text, x, y, maxWidth, lineHeight) {
  var pageHeight = doc.internal.pageSize.getHeight();
  var bottomMargin = 20;
  var paragraphs = String(text || '').split('\n');
  for (var p = 0; p < paragraphs.length; p++) {
    var paragraph = paragraphs[p];
    var words = paragraph.trim().split(/\s+/);
    if (words.length === 1 && words[0] === '') { y += lineHeight; continue; }
    var lines = [];
    var currentLine = [];
    var currentLineWidth = 0;
    var spaceWidth = doc.getTextWidth(' ');
    for (var w = 0; w < words.length; w++) {
      var word = words[w];
      var wordWidth = doc.getTextWidth(word);
      if (currentLine.length === 0) {
        currentLine.push(word);
        currentLineWidth = wordWidth;
      } else if (currentLineWidth + spaceWidth + wordWidth <= maxWidth) {
        currentLine.push(word);
        currentLineWidth += spaceWidth + wordWidth;
      } else {
        lines.push(currentLine);
        currentLine = [word];
        currentLineWidth = wordWidth;
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);
    for (var li = 0; li < lines.length; li++) {
      if (y + lineHeight > pageHeight - bottomMargin) { doc.addPage(); y = 20; }
      var lineWords = lines[li];
      if (lineWords.length > 1 && li < lines.length - 1) {
        var totalWordsWidth = 0;
        for (var tw = 0; tw < lineWords.length; tw++) totalWordsWidth += doc.getTextWidth(lineWords[tw]);
        var gaps = lineWords.length - 1;
        var extraSpace = (maxWidth - totalWordsWidth - (gaps * doc.getTextWidth(' '))) / gaps;
        var currentX = x;
        for (var lw = 0; lw < lineWords.length; lw++) {
          doc.text(lineWords[lw], currentX, y);
          currentX += doc.getTextWidth(lineWords[lw]);
          if (lw < gaps) currentX += doc.getTextWidth(' ') + extraSpace;
        }
      } else {
        doc.text(lineWords.join(' '), x, y);
      }
      y += lineHeight;
    }
  }
  return y;
}

function drawLabelValueBlock(doc, label, value, x, y, labelWidth, valueWidth, lineHeight) {
  doc.setFont('helvetica', 'bold');
  doc.text(label, x, y);
  doc.setFont('helvetica', 'normal');
  return drawJustifiedTextBlock(doc, value, x + labelWidth, y, valueWidth, lineHeight);
}

function addSelectBlock(container, labelText, name, yesNo, textareaName) {
  var div = document.createElement('div');
  div.className = 'checklist-item';
  var html = '<label>' + labelText + ':</label>';
  html += '<select name="' + name + '"' + (textareaName ? ' class="toggle-select"' : '') + '>';
  html += '<option value="">Selecione</option>';
  if (yesNo) {
    html += '<option value="sim">✔ Sim</option><option value="nao">❌ Não</option>';
  } else {
    html += '<option value="resolvido">✔ Resolvido</option><option value="pendente">❌ Pendente</option><option value="naoVerificado">⚠️ Não Verificado</option>';
  }
  html += '</select>';
  if (textareaName) html += '<textarea name="' + textareaName + '" class="toggle-obs" style="display:none;" placeholder="Descreva os achados..."></textarea>';
  div.innerHTML = html;
  container.appendChild(div);
  if (textareaName) {
    var selectElement = div.querySelector('select');
    var textareaElement = div.querySelector('textarea');
    selectElement.onchange = function() {
      textareaElement.style.display = (selectElement.value === 'sim') ? 'block' : 'none';
      if (selectElement.value !== 'sim') textareaElement.value = '';
    };
  }
}

function setupForm() {
  var checklistContainer = document.getElementById('checklistContainer');
  var humanitarianContainer = document.getElementById('humanitarianContainer');
  var structuralContainer = document.getElementById('structuralContainer');
  for (var i = 0; i < checklistItems.length; i++) addSelectBlock(checklistContainer, (i + 1) + '. ' + checklistItems[i], 'item_' + (i + 1), false, null);
  for (i = 0; i < humanitarianItems.length; i++) addSelectBlock(humanitarianContainer, humanitarianItems[i], 'humanitarian_item_' + (i + 1), true, 'humanitarian_obs_' + (i + 1));
  for (i = 0; i < structuralItems.length; i++) addSelectBlock(structuralContainer, structuralItems[i], 'structural_item_' + (i + 1), true, 'structural_obs_' + (i + 1));

  var otherDetChoice = document.getElementById('other_determinations_choice');
  var otherDetTextarea = document.getElementById('other_determinations');
  if (otherDetChoice && otherDetTextarea) {
    otherDetChoice.onchange = function() {
      otherDetTextarea.style.display = (otherDetChoice.value === 'sim') ? 'block' : 'none';
      if (otherDetChoice.value !== 'sim') otherDetTextarea.value = '';
    };
  }

  var addDate = document.getElementById('addDate');
  if (addDate) {
    addDate.onclick = function() {
      var container = document.querySelector('.info-section');
      var input = document.createElement('input');
      input.type = 'date';
      input.name = 'inspection_date[]';
      container.appendChild(document.createElement('br'));
      container.appendChild(input);
    };
  }

  var addFoto = document.getElementById('addFoto');
  var fotoInputsContainer = document.getElementById('fotoInputsContainer');
  if (addFoto && fotoInputsContainer) {
    addFoto.onclick = function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.className = 'foto-input';
      input.accept = 'image/*';
      fotoInputsContainer.appendChild(input);
    };
  }

  document.getElementById('generatePDF').onclick = generatePDF;
  document.getElementById('generateDOC').onclick = generateDOC;
}

function buildFinalText(data) {
  var section1Items = [];
  var section2Items = [];
  var i, obs;
  for (i = 0; i < checklistItems.length; i++) if (data['item_' + (i + 1)] === 'pendente') section1Items.push('• ' + checklistItems[i] + ' (Resposta: Pendente)');
  for (i = 0; i < structuralItems.length; i++) if (data['structural_item_' + (i + 1)] === 'sim') { obs = data['structural_obs_' + (i + 1)] || ''; section1Items.push('• ' + structuralItems[i] + ' (Resposta: Sim' + (obs ? ' - Achados: ' + obs : '') + ')'); }
  if ((data.other_records_presidencia || '').trim() !== '') section1Items.push('• Outros registros de responsabilidade da Presidência do IAPEN: ' + data.other_records_presidencia.trim());
  for (i = 0; i < humanitarianItems.length; i++) if (data['humanitarian_item_' + (i + 1)] === 'sim') { obs = data['humanitarian_obs_' + (i + 1)] || ''; section2Items.push('• ' + humanitarianItems[i] + ' (Resposta: Sim' + (obs ? ' - Achados: ' + obs : '') + ')'); }
  if ((data.other_records_direcao || '').trim() !== '') section2Items.push('• Outros registros de responsabilidade da direção da unidade prisional: ' + data.other_records_direcao.trim());

  var finalText = 'A partir das constatações realizadas durante a inspeção, a equipe responsável registra os seguintes achados, para ciência e apreciação do MM Juiz da Vara de Execução de Penas no Regime Fechado.\n\n';
  finalText += '1. Achados relacionados à estrutura, gestão ou providências de responsabilidade da Presidência do IAPEN:\n';
  finalText += section1Items.length > 0 ? section1Items.join('\n') + '\n\n' : 'Nenhuma pendência/irregularidade identificada.\n\n';
  if (section1Items.length > 0) finalText += 'Sugere-se, salvo melhor juízo, a expedição de ofício ao Diretor-Presidente do IAPEN, com remessa de cópia do presente relatório, para que preste informações, no prazo que vier a ser fixado por Vossa Excelência, acerca das providências adotadas ou em andamento para solução das questões apontadas.\n\n';
  finalText += '2. Achados relacionados à direção da unidade prisional ou a relatos individuais de possível violação de direitos:\n';
  finalText += section2Items.length > 0 ? section2Items.join('\n') + '\n\n' : 'Nenhuma pendência/irregularidade identificada.\n\n';
  if (section2Items.length > 0) finalText += 'Sugere-se, salvo melhor juízo, a expedição de ofício à direção da unidade prisional pertinente, com remessa de cópia do presente relatório, para que informe as providências adotadas ou em andamento quanto aos fatos relatados, no prazo que vier a ser fixado por Vossa Excelência.\n';
  finalText += '\n3. Outras observações ou sugestões da equipe de inspeção:\n';
  if (data.other_determinations_choice === 'sim' && (data.other_determinations || '').trim() !== '') finalText += data.other_determinations.trim() + '\n\n';
  else finalText += 'Nada mais foi registrado pela equipe neste campo.\n\n';
  finalText += 'Submetem-se os presentes registros à apreciação de Vossa Excelência, para deliberação quanto às providências cabíveis.\n\nAs informações de rotina atinentes à estrutura física das unidades prisionais, quantitativo de agentes, população carcerária, fugas, apreensões e outras intercorrências serão verificadas junto à direção, para informação padrão ao Conselho Nacional de Justiça e à Corregedoria Geral da Justiça.';
  return finalText;
}

function generatePDF() {
  try {
    if (!window.jspdf || !window.jspdf.jsPDF) { alert('A biblioteca de PDF não carregou. Abra o aplicativo uma vez com internet e tente novamente.'); return; }
    var data = collectData();
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF();
    var marginLeft = 10, marginRight = 15, totalWidth = 210 - marginLeft - marginRight, labelWidth = 55, valueWidth = totalWidth - labelWidth, lineHeight = 7, blockPadding = 3;
    doc.setFillColor(139, 0, 0); doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('Termo de Inspeção', 105, 15, { align: 'center' });
    doc.setFontSize(12); doc.text('Vara de Execução de Penas no Regime Fechado', 105, 22, { align: 'center' }); doc.text('Corregedoria dos Presídios da Capital', 105, 29, { align: 'center' });
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal');
    var currentY = 42;
    var initialBlockContentTop = currentY + lineHeight;
    var initialBlockTop = currentY - blockPadding;
    var initialBlockContentY = initialBlockContentTop;
    initialBlockContentY = drawLabelValueBlock(doc, 'Data (s):', data.inspection_date || '____', marginLeft, initialBlockContentY, labelWidth, valueWidth, lineHeight) + lineHeight;
    initialBlockContentY = drawLabelValueBlock(doc, 'Fundamento legal:', data.fundamento || 'Art. 66, VII, da Lei 7.210/84; Resolução CNJ Nº 593/2024 e arts. 883 e 884, I e IV, do Provimento COGER/TJAC Nº 16/2016.', marginLeft, initialBlockContentY, labelWidth, valueWidth, lineHeight) + lineHeight;
    initialBlockContentY = drawLabelValueBlock(doc, 'Objetivos da inspeção:', data.objetivos || 'Verificar o cumprimento de parâmetros referentes às condições de custódia, direitos e serviços que devem ser garantidos às pessoas privadas de liberdade, com diferenciada atenção para aquelas com vulnerabilidades acrescidas, e adotar as providências cabíveis para sanar as irregularidades identificadas.', marginLeft, initialBlockContentY, labelWidth, valueWidth, lineHeight) + lineHeight;
    initialBlockContentY = drawLabelValueBlock(doc, 'Unidades inspecionadas:', data.prison_unit || '____', marginLeft, initialBlockContentY, labelWidth, valueWidth, lineHeight) + lineHeight;
    doc.setLineWidth(0.75); doc.setDrawColor(80, 80, 80); doc.rect(marginLeft - blockPadding, initialBlockTop, totalWidth + 2 * blockPadding, (initialBlockContentY - initialBlockTop) + blockPadding, 'D');
    currentY = initialBlockContentY + 10;

    doc.autoTable({ head: [[ 'Aspectos gerais e monitoramento das providências já recomendadas pelo juízo da Execução Penal e pelo GMF', 'Status' ]], body: checklistItems.map(function(item, i){ return [item, data['item_' + (i + 1)] || 'Não selecionado']; }), startY: currentY, margin: { left: marginLeft }, theme: 'grid', headStyles: { fillColor: [139, 0, 0], textColor: 255, fontStyle: 'bold' }, styles: { fontSize: 10, cellPadding: 3 } });
    currentY = doc.lastAutoTable.finalY + 10;
    doc.autoTable({ head: [[ 'Relatos individuais relevantes', 'Resposta' ]], body: humanitarianItems.map(function(item, i){ var r = data['humanitarian_item_' + (i + 1)] || 'Não selecionado'; var o = data['humanitarian_obs_' + (i + 1)] || ''; return [item, r + (o ? ' - ' + o : '')]; }), startY: currentY, margin: { left: marginLeft }, theme: 'grid', headStyles: { fillColor: [139, 0, 0], textColor: 255, fontStyle: 'bold' }, styles: { fontSize: 10, cellPadding: 3 } });
    currentY = doc.lastAutoTable.finalY + 10;
    doc.autoTable({ head: [[ 'Averiguações de segurança', 'Resposta' ]], body: structuralItems.map(function(item, i){ var r = data['structural_item_' + (i + 1)] || 'Não selecionado'; var o = data['structural_obs_' + (i + 1)] || ''; return [item, r + (o ? ' - ' + o : '')]; }), startY: currentY, margin: { left: marginLeft }, theme: 'grid', headStyles: { fillColor: [139, 0, 0], textColor: 255, fontStyle: 'bold' }, styles: { fontSize: 10, cellPadding: 3 } });
    currentY = doc.lastAutoTable.finalY + 10;
    doc.autoTable({ head: [[ 'Outros registros de responsabilidade da Presidência do IAPEN' ]], body: [[ (data.other_records_presidencia || '').trim() || '____' ]], startY: currentY, margin: { left: marginLeft }, theme: 'grid', headStyles: { fillColor: [139, 0, 0], textColor: 255, fontStyle: 'bold' }, styles: { fontSize: 10, cellPadding: 3 } });
    currentY = doc.lastAutoTable.finalY + 10;
    doc.autoTable({ head: [[ 'Outros registros de responsabilidade da direção da unidade prisional' ]], body: [[ (data.other_records_direcao || '').trim() || '____' ]], startY: currentY, margin: { left: marginLeft }, theme: 'grid', headStyles: { fillColor: [139, 0, 0], textColor: 255, fontStyle: 'bold' }, styles: { fontSize: 10, cellPadding: 3 } });
    currentY = doc.lastAutoTable.finalY + 10;
    if (currentY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); currentY = 20; }
    currentY = drawJustifiedTextBlock(doc, buildFinalText(data), marginLeft, currentY, totalWidth, lineHeight) + 10;
    finalizeAndSavePDF(doc, marginLeft);
  } catch (error) {
    alert('Erro ao gerar o PDF: ' + (error && error.message ? error.message : error));
  }
}

function finalizeAndSavePDF(doc, marginLeft) {
  var files = getSelectedPhotoFiles();
  if (!files || files.length === 0) { addFooterAndSave(doc); return; }
  doc.addPage();
  var photosPerPage = 6, gap = 5, columns = 2, pageWidth = 210, pageH = doc.internal.pageSize.getHeight();
  var imageWidth = (pageWidth - 2 * marginLeft - gap) / columns;
  var imageHeight = (pageH - 2 * marginLeft - 2 * gap) / 3;
  var photoCount = 0;
  var fileIndex = 0;

  function addNextPhoto() {
    if (fileIndex >= files.length) {
      addFooterAndSave(doc);
      return;
    }

    var currentFile = files[fileIndex];
    readFileAsArrayBuffer(currentFile, function(arrayBuffer) {
      var orientation = getExifOrientation(arrayBuffer);
      readFileAsDataURL(currentFile, function(dataUrl) {
        fixImageOrientation(dataUrl, orientation, function(fixedDataUrl) {
          addPhotoDataURL(fixedDataUrl);
        }, function() {
          addPhotoDataURL(dataUrl);
        });
      }, function() {
        fileIndex++;
        addNextPhoto();
      });
    }, function() {
      readFileAsDataURL(currentFile, function(dataUrl) {
        addPhotoDataURL(dataUrl);
      }, function() {
        fileIndex++;
        addNextPhoto();
      });
    });
  }

  function addPhotoDataURL(dataUrl) {
      var format = getImageFormatFromDataURL(dataUrl);
      if (photoCount > 0 && photoCount % photosPerPage === 0) doc.addPage();
      var posIndex = photoCount % photosPerPage;
      var currentRow = Math.floor(posIndex / columns);
      var currentCol = posIndex % columns;
      var posX = marginLeft + currentCol * (imageWidth + gap);
      var posY = marginLeft + currentRow * (imageHeight + gap);

      try {
        doc.addImage(dataUrl, format, posX, posY, imageWidth, imageHeight);
        photoCount++;
      } catch (e) {
        try {
          doc.addImage(dataUrl, undefined, posX, posY, imageWidth, imageHeight);
          photoCount++;
        } catch (ignored) {}
      }

      fileIndex++;
      addNextPhoto();
  }

  addNextPhoto();
}

function addFooterAndSave(doc) {
  var totalPages = doc.getNumberOfPages();
  for (var i = 1; i <= totalPages; i++) {
    doc.setPage(i); doc.setFontSize(10); doc.text('Página ' + i + ' de ' + totalPages, 105, 285, { align: 'center' }); doc.text('Assinatura do responsável e data lançadas digitalmente', 105, 292, { align: 'center' });
  }
  doc.save('termo_inspecao.pdf');
}

function generateDOC() {
  try {
    var data = collectData();
    var html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Termo de Inspeção</title></head><body>";
    html += '<h1>Termo de Inspeção</h1>';
    html += '<p><strong>Data(s):</strong> ' + (data.inspection_date || '') + '</p>';
    html += '<p><strong>Fundamento legal:</strong> ' + (data.fundamento || '') + '</p>';
    html += '<p><strong>Objetivos da inspeção:</strong> ' + (data.objetivos || '') + '</p>';
    html += '<p><strong>Unidades inspecionadas:</strong> ' + (data.prison_unit || '') + '</p>';
    html += '<h2>Checklist de Inspeção</h2><ul>';
    for (var i = 0; i < checklistItems.length; i++) html += '<li>' + checklistItems[i] + ' - ' + (data['item_' + (i + 1)] || 'Não selecionado') + '</li>';
    html += '</ul><h2>Relatos Humanitários</h2><ul>';
    for (i = 0; i < humanitarianItems.length; i++) html += '<li>' + humanitarianItems[i] + ' - ' + (data['humanitarian_item_' + (i + 1)] || 'Não selecionado') + ((data['humanitarian_obs_' + (i + 1)] || '') ? ' - ' + data['humanitarian_obs_' + (i + 1)] : '') + '</li>';
    html += '</ul><h2>Questões Estruturais</h2><ul>';
    for (i = 0; i < structuralItems.length; i++) html += '<li>' + structuralItems[i] + ' - ' + (data['structural_item_' + (i + 1)] || 'Não selecionado') + ((data['structural_obs_' + (i + 1)] || '') ? ' - ' + data['structural_obs_' + (i + 1)] : '') + '</li>';
    html += '</ul><h2>Resumo dos Achados</h2><p>' + buildFinalText(data).replace(/\n/g, '<br>') + '</p></body></html>';
    var url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    var link = document.createElement('a');
    document.body.appendChild(link);
    link.href = url;
    link.download = 'termo_inspecao.doc';
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    alert('Erro ao gerar o DOC: ' + (error && error.message ? error.message : error));
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(function(){});
}

if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', setupForm);
} else {
  window.onload = setupForm;
}
