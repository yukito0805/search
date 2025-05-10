// マップ初期化
const map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -3,
  maxZoom: 3,
  zoom: -1,
  zoomControl: true,
  zoomAnimation: true,
  doubleClickZoom: false
});

// エリア定義
const areas = {
  mondstadt: { url: 'images/mondstadt.png', width: 3878, height: 2765, subAreas: {} },
  liyue: { 
    url: 'images/liyue.png', 
    width: 4571, 
    height: 4169,
    subAreas: { 
      sougan: { url: 'images/natlan_P0.png', width: 1893, height: 1677 } 
    } 
  },
  inazuma: { 
    url: 'images/inazuma1_P0.png', 
    width: 6018, 
    height: 5568, 
    subAreas: { 
      enkonomiya: { url: 'images/inazuma_P0.png', width: 3171, height: 3018 }
    } 
  },
  sumeru: { url: 'images/sumeru_P0_highres.png', width: 5578, height: 5543, subAreas: {} },
  fontaine: { 
    url: 'images/fontaine_map.png', 
    width: 3175, 
    height: 4356, 
    subAreas: { 
      ancientSea: { url: 'images/map34_P0.png', width: 1998, height: 1014 } 
    } 
  },
  natlan: { 
    url: 'images/natlan_N1.png', 
    width: 5432, 
    height: 5896, 
    subAreas: { 
      ancientMountain: { url: 'images/map36_P0.png', width: 2634, height: 3117 } 
    } 
  }
};

// 現在のエリアとサブエリア
let currentArea = 'mondstadt';
let currentSubArea = null;
let currentOverlay = null;

// ピンのアイコン定義
const pinIcons = {
  '風神瞳': { url: 'images/hujin.jpg', size: [48, 48], anchor: [24, 24] },
  '岩神瞳': { url: 'images/iwagami.jpg', size: [48, 48], anchor: [24, 24] },
  '雷神瞳': { url: 'images/inazumahitomi.png', size: [48, 48], anchor: [24, 24] },
  '草神瞳': { url: 'images/sousin.png', size: [48, 48], anchor: [24, 24] },
  '水神瞳': { url: 'images/suijin.png', size: [48, 48], anchor: [24, 24] },
  '炎神瞳': { url: 'images/enjin.png', size: [48, 48], anchor: [24, 24] },
  'チャレンジ': { url: 'images/challenge.png', size: [48, 48], anchor: [24, 24] },
  '仙霊': { url: 'images/senrei.png', size: [48, 48], anchor: [24, 24] },
  '元素石碑': { url: 'images/sekihi.png', size: [48, 48], anchor: [24, 24] },
  '立方体': { url: 'images/square.png', size: [48, 48], anchor: [24, 24] },
  '鍵紋1': { url: 'images/key1.png', size: [48, 48], anchor: [24, 24] },
  '鍵紋2': { url: 'images/key2.png', size: [48, 48], anchor: [24, 24] },
  '鍵紋3': { url: 'images/key3.png', size: [48, 48], anchor: [24, 24] },
  '鍵紋4': { url: 'images/key4.png', size: [48, 48], anchor: [24, 24] },
  '鍵紋5': { url: 'images/key5.png', size: [48, 48], anchor: [24, 24] },
  '雷霊': { url: 'images/rairei.png', size: [48, 48], anchor: [24, 24] },
  'アランナラ': { url: 'images/arannara.png', size: [48, 48], anchor: [24, 24] },
  'スメールギミック': { url: 'images/SGimmick.png', size: [48, 48], anchor: [24, 24] },
  'リーフコア': { url: 'images/leaf.png', size: [48, 48], anchor: [24, 24] },
  '短火装置': { url: 'images/dai.png', size: [48, 48], anchor: [24, 24] },
  '死域': { url: 'images/shiki.png', size: [48, 48], anchor: [24, 24] },
  '普通の宝箱': { url: 'images/hutu.png', size: [48, 48], anchor: [24, 24] },
  '精巧な宝箱': { url: 'images/seikou.png', size: [48, 48], anchor: [24, 24] },
  '貴重な宝箱': { url: 'images/kityou.png', size: [48, 48], anchor: [24, 24] },
  '豪華な宝箱': { url: 'images/gouka.png', size: [48, 48], anchor: [24, 24] },
  '珍奇な宝箱': { url: 'images/tinki.png', size: [48, 48], anchor: [24, 24] }
};

// 宝箱の印数
const chestSeals = {
  '普通の宝箱': 1,
  '精巧な宝箱': 2,
  '貴重な宝箱': 3,
  '豪華な宝箱': 4,
  '珍奇な宝箱': 0
};

// ピンデータ
let pins = JSON.parse(localStorage.getItem('pins') || '[]');
// 既存ピンの obtained を true に設定
pins = pins.map(pin => ({
  ...pin,
  obtained: pin.obtained !== undefined ? pin.obtained : true,
  downway: pin.downway || false,
  gimmick: pin.gimmick || false
}));
localStorage.setItem('pins', JSON.stringify(pins));
let editingIndex = null;

// 線データ
let lines = JSON.parse(localStorage.getItem('lines') || '[]');

// ピンの表示/非表示状態
const visibleIcons = JSON.parse(localStorage.getItem('visibleIcons') || '{}');
Object.keys(pinIcons).forEach(icon => {
  if (visibleIcons[icon] === undefined) visibleIcons[icon] = true;
});
localStorage.setItem('visibleIcons', JSON.stringify(visibleIcons));

// ピンを結ぶ選択状態
let connectingPinIndex = null;

// マップの表示
function loadMap(area, subArea = null) {
  console.log('loadMap called:', { area, subArea });
  const areaData = subArea ? areas[area].subAreas[subArea] : areas[area];
  if (!areaData) {
    console.error('Invalid area or subArea:', { area, subArea });
    return;
  }
  console.log('Loading map:', areaData.url, 'Dimensions:', areaData.width, 'x', areaData.height);
  const bounds = [[0, 0], [areaData.height, areaData.width]];

  // 既存のレイヤーをすべてクリア
  map.eachLayer(layer => {
    if (layer instanceof L.ImageOverlay || layer instanceof L.Marker || layer instanceof L.Polyline) {
      map.removeLayer(layer);
      console.log('Removed layer:', layer);
    }
  });
  currentOverlay = null;

  // 新しいマップ画像を追加
  currentOverlay = L.imageOverlay(areaData.url, bounds)
    .on('error', () => console.error('Failed to load map image:', areaData.url))
    .on('load', () => console.log('Map image loaded successfully:', areaData.url))
    .addTo(map);
  console.log('Added new overlay:', areaData.url);

  try {
    map.fitBounds(bounds);
    map.setMaxBounds(bounds);
    console.log('Map bounds set:', bounds);
  } catch (err) {
    console.error('Error setting map bounds:', err);
  }

  // ピンと線を再描画
  refreshMap();
  updateCounts();
  updateSealCounts();
}

// ピンの表示/非表示チェックボックス初期化
function initVisibilityControls() {
  const container = document.getElementById('iconVisibilityControls');
  container.innerHTML = '';
  Object.keys(pinIcons).forEach(icon => {
    const div = document.createElement('div');
    div.className = 'form-check';
    div.innerHTML = `
      <input class="form-check-input" type="checkbox" id="visibility-${icon}" ${visibleIcons[icon] ? 'checked' : ''}>
      <label class="form-check-label" for="visibility-${icon}">${icon}</label>
    `;
    container.appendChild(div);
    document.getElementById(`visibility-${icon}`).addEventListener('change', function () {
      visibleIcons[icon] = this.checked;
      localStorage.setItem('visibleIcons', JSON.stringify(visibleIcons));
      refreshMap();
      console.log(`Visibility toggled for ${icon}: ${this.checked}`);
    });
  });
}

// 初期マップ（モンド）
try {
  loadMap(currentArea);
  initVisibilityControls();
  console.log('Initial map loaded');
} catch (err) {
  console.error('Error loading initial map:', err);
}

// エリア選択
$('#areaSelect').on('change', function () {
  currentArea = $(this).val();
  currentSubArea = null;
  console.log('Area selected:', currentArea);
  loadMap(currentArea);
  
  const subAreas = areas[currentArea].subAreas;
  $('#subAreaSelect').empty().append('<option value="">サブエリアを選択</option>');
  if (Object.keys(subAreas).length > 0) {
    for (const [key, value] of Object.entries(subAreas)) {
      $('#subAreaSelect').append(`<option value="${key}">${key === 'sougan' ? '層岩巨淵' : key === 'enkonomiya' ? '淵下宮' : key === 'ancientSea' ? '往日の海' : '古の聖山'}</option>`);
    }
    $('#subAreaSelect').show();
  } else {
    $('#subAreaSelect').hide();
  }
});

// サブエリア選択
$('#subAreaSelect').on('change', function () {
  currentSubArea = $(this).val() || null;
  console.log('SubArea selected:', currentSubArea);
  loadMap(currentArea, currentSubArea);
});

// 取得済み状態の切り替え
function toggleObtained(index) {
  console.log('toggleObtained called:', { index });
  try {
    pins[index].obtained = !pins[index].obtained;
    localStorage.setItem('pins', JSON.stringify(pins));
    refreshMap();
    updateCounts();
    updateSealCounts();
    console.log('Obtained state toggled:', pins[index]);
  } catch (err) {
    console.error('Error toggling obtained state:', err);
  }
}

// ピンを結ぶ
function connectPin(index) {
  console.log('connectPin called:', { index });
  if (connectingPinIndex === null) {
    connectingPinIndex = index;
    console.log('First pin selected for connection:', index);
    // alert('次に結ぶピンを選択してください。');
  } else if (connectingPinIndex !== index) {
    const line = {
      from: connectingPinIndex,
      to: index,
      area: currentArea,
      subArea: currentSubArea
    };
    lines.push(line);
    localStorage.setItem('lines', JSON.stringify(lines));
    refreshMap();
    connectingPinIndex = null;
    console.log('Line created:', line);
  }
}

// 線の削除
function deleteLine(index) {
  console.log('deleteLine called:', { index });
  lines = lines.filter(line => !(line.from === index || line.to === index));
  localStorage.setItem('lines', JSON.stringify(lines));
  refreshMap();
  console.log('Lines updated:', lines);
}

// ピンのマップ表示
function addPinToMap(pin, index) {
  if (
    pin.area !== currentArea ||
    (pin.subArea && pin.subArea !== currentSubArea) ||
    (!pin.subArea && currentSubArea) ||
    !visibleIcons[pin.icon]
  ) {
    console.log('Skipping pin:', pin);
    return;
  }
  console.log('Adding pin:', pin);
  const icon = pinIcons[pin.icon];
  if (!icon) {
    console.error('Invalid icon:', pin.icon);
    return;
  }

  // ピンのアイコン
  const marker = L.marker([pin.lat, pin.lng], {
    icon: L.icon({
      iconUrl: icon.url,
      iconSize: icon.size,
      iconAnchor: icon.anchor,
      popupAnchor: [0, -icon.anchor[1]],
      className: pin.obtained ? '' : 'grayscale'
    })
  })
    .addTo(map)
    .bindPopup(`
      <strong>${pin.icon}${getFlagText(pin)}</strong><br>
      <p>取得済み: ${pin.obtained ? 'はい' : 'いいえ'}</p>
      ${pin.note ? `<p>備考: ${pin.note}</p>` : ''}
      ${pin.image ? `<img src="${pin.image}" style="max-width: 200px;">` : ''}
      ${pin.video ? `<iframe width="200" height="150" src="${pin.video.replace('watch?v=', 'embed/')}"></iframe>` : ''}
      <div class="mt-2 d-flex align-items-center gap-2 flex-wrap">
        <button class="btn btn-sm btn-primary" onclick="editPin(${index})">編集</button>
        <button class="btn btn-sm btn-danger" onclick="deletePin(${index})">削除</button>
        <button class="btn btn-sm btn-success" onclick="connectPin(${index})">ピンを結ぶ</button>
        <button class="btn btn-sm btn-warning" onclick="deleteLine(${index})">線を削除</button>
        <div class="form-check form-check-inline">
          <input class="form-check-input obtained-checkbox" type="checkbox" id="obtained-${index}" ${pin.obtained ? 'checked' : ''} onchange="toggleObtained(${index})">
          <label class="form-check-label" for="obtained-${index}">取得済み</label>
        </div>
      </div>
    `)
    .on('add', () => {
      console.log('Pin added to map:', pin);
      const img = new Image();
      img.src = icon.url;
      img.onerror = () => console.error(`Failed to load pin icon: ${icon.url}`);
    });

  // バッジの表示
  let badges = '';
  if (pin.downway) badges += '<span class="pin-badge badge-downway">D</span>';
  if (pin.underground) badges += '<span class="pin-badge badge-underground">U</span>';
  if (pin.seelie) badges += '<span class="pin-badge badge-seelie">S</span>';
  if (pin.electroSeelie) badges += '<span class="pin-badge badge-electroSeelie">E</span>';
  if (pin.challenge) badges += '<span class="pin-badge badge-challenge">C</span>';
  if (pin.gimmick) badges += '<span class="pin-badge badge-gimmick">G</span>';

  if (badges) {
    console.log('Badges:', badges);
    L.marker([pin.lat, pin.lng], {
      icon: L.divIcon({
        html: `<div style="text-align: center;">${badges}</div>`,
        iconSize: [badges.length * 14, 12],
        iconAnchor: [badges.length * 7, -5],
        className: 'badge-container'
      })
    }).addTo(map);
    console.log('Badges added to map');
  }
}

// フラグテキストの生成
function getFlagText(pin) {
  const flags = [];
  if (pin.downway) flags.push('下道');
  if (pin.underground) flags.push('地下');
  if (pin.seelie) flags.push('仙霊');
  if (pin.electroSeelie) flags.push('雷霊');
  if (pin.challenge) flags.push('チャレンジ');
  if (pin.gimmick) flags.push('ギミック');
  return flags.length ? ` (${flags.join(', ')})` : '';
}

// ピン追加（右クリック＋左クリック）
function openPinModal(e) {
  console.log('Opening modal at:', e.latlng);
  window.tempCoords = e.latlng;
  editingIndex = null;
  $('#pinForm')[0].reset();
  $('#pinIcon').val('');
  $('#downway').prop('checked', false);
  $('#underground').prop('checked', false);
  $('#seelie').prop('checked', false);
  $('#electroSeelie').prop('checked', false);
  $('#challenge').prop('checked', false);
  $('#gimmick').prop('checked', false);
  $('#obtained').prop('checked', false);
  $('#imagePreview').hide();
  $('#videoPreview').hide();
  $('.icon-option').removeClass('selected');
  try {
    $('#pinModal').modal('show');
    console.log('Modal opened successfully');
  } catch (err) {
    console.error('Modal open error:', err);
  }
}

// 右クリック（PC向け）
map.on('contextmenu', openPinModal);

// 左クリック（iPad向け）
map.on('click', openPinModal);

// アイコン選択
$('.icon-option').on('click', function () {
  $('.icon-option').removeClass('selected');
  $(this).addClass('selected');
  $('#pinIcon').val($(this).data('icon'));
  console.log('Icon selected:', $(this).data('icon'));
});

// ピンの保存
function savePin() {
  console.log('savePin called');
  const icon = $('#pinIcon').val();
  if (!icon) {
    console.warn('No icon selected');
    return;
  }
  const pin = {
    icon: icon,
    note: document.getElementById('pinNote').value,
    image: document.getElementById('pinImage').value,
    video: document.getElementById('pinVideo').value,
    lat: window.tempCoords.lat,
    lng: window.tempCoords.lng,
    area: currentArea,
    subArea: currentSubArea,
    downway: $('#downway').prop('checked'),
    underground: $('#underground').prop('checked'),
    seelie: $('#seelie').prop('checked'),
    electroSeelie: $('#electroSeelie').prop('checked'),
    challenge: $('#challenge').prop('checked'),
    gimmick: $('#gimmick').prop('checked'),
    obtained: $('#obtained').prop('checked')
  };
  console.log('Saving pin:', pin);

  try {
    if (editingIndex !== null) {
      pins[editingIndex] = pin;
    } else {
      pins.push(pin);
    }
    localStorage.setItem('pins', JSON.stringify(pins));
    refreshMap();
    updateCounts();
    updateSealCounts();
    console.log('Pin saved successfully');
  } catch (err) {
    console.error('Error saving pin:', err);
  }

  // モーダルを閉じる
  try {
    $('#pinModal').modal('hide');
    console.log('Modal closed successfully');
    $('#pinForm')[0].reset();
    $('#pinIcon').val('');
    $('.icon-option').removeClass('selected');
    $('#imagePreview').hide();
    $('#videoPreview').hide();
  } catch (err) {
    console.error('Error closing modal:', err);
  }
}

// ピンの編集
function editPin(index) {
  console.log('Editing pin:', pins[index]);
  editingIndex = index;
  const pin = pins[index];
  $('#pinIcon').val(pin.icon);
  $('#pinNote').val(pin.note);
  $('#pinImage').val(pin.image);
  $('#pinVideo').val(pin.video);
  $('#downway').prop('checked', pin.downway || false);
  $('#underground').prop('checked', pin.underground || false);
  $('#seelie').prop('checked', pin.seelie || false);
  $('#electroSeelie').prop('checked', pin.electroSeelie || false);
  $('#challenge').prop('checked', pin.challenge || false);
  $('#gimmick').prop('checked', pin.gimmick || false);
  $('#obtained').prop('checked', pin.obtained || false);
  $('.icon-option').removeClass('selected');
  $(`.icon-option[data-icon="${pin.icon}"]`).addClass('selected');
  window.tempCoords = { lat: pin.lat, lng: pin.lng };
  updatePreviews();
  try {
    $('#pinModal').modal('show');
    console.log('Edit modal opened successfully');
  } catch (err) {
    console.error('Edit modal open error:', err);
  }
}

// ピンの削除
function deletePin(index) {
  console.log('Deleting pin:', index);
  try {
    pins.splice(index, 1);
    lines = lines.filter(line => line.from !== index && line.to !== index);
    lines = lines.map(line => ({
      ...line,
      from: line.from > index ? line.from - 1 : line.from,
      to: line.to > index ? line.to - 1 : line.to
    }));
    localStorage.setItem('pins', JSON.stringify(pins));
    localStorage.setItem('lines', JSON.stringify(lines));
    refreshMap();
    updateCounts();
    updateSealCounts();
    console.log('Pin deleted successfully');
  } catch (err) {
    console.error('Error deleting pin:', err);
  }
}

// マップのリフレッシュ
function refreshMap() {
  console.log('refreshMap called');
  map.eachLayer(layer => {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
      map.removeLayer(layer);
      console.log('Removed layer:', layer);
    }
  });
  pins.forEach((pin, index) => {
    addPinToMap(pin, index);
  });
  lines.forEach((line, index) => {
    if (
      line.area === currentArea &&
      (!line.subArea && !currentSubArea || line.subArea === currentSubArea) &&
      pins[line.from] && pins[line.to]
    ) {
      L.polyline([
        [pins[line.from].lat, pins[line.from].lng],
        [pins[line.to].lat, pins[line.to].lng]
      ], {
        color: '#ff0000',
        weight: 2,
        className: 'connection-line'
      }).addTo(map);
      console.log('Line added:', line);
    }
  });
  console.log('Map refreshed, pins:', pins.length, 'lines:', lines.length);
}

// ピンのカウント更新（取得済みのみ）
function updateCounts() {
  console.log('updateCounts called');
  const counts = {
    '風神瞳': 0,
    '岩神瞳': 0,
    '雷神瞳': 0,
    '草神瞳': 0,
    '水神瞳': 0,
    '炎神瞳': 0,
    'チャレンジ': 0,
    '仙霊': 0,
    '元素石碑': 0,
    '立方体': 0,
    '鍵紋1': 0,
    '鍵紋2': 0,
    '鍵紋3': 0,
    '鍵紋4': 0,
    '鍵紋5': 0,
    '雷霊': 0,
    'アランナラ': 0,
    'スメールギミック': 0,
    'リーフコア': 0,
    '短火装置': 0,
    '死域': 0,
    '普通の宝箱': 0,
    '精巧な宝箱': 0,
    '貴重な宝箱': 0,
    '豪華な宝箱': 0,
    '珍奇な宝箱': 0
  };
  pins.forEach(pin => {
    if (
      pin.area === currentArea &&
      (!pin.subArea && !currentSubArea || pin.subArea === currentSubArea) &&
      pin.obtained === true
    ) {
      if (counts[pin.icon] !== undefined) counts[pin.icon]++;
    }
  });
  document.getElementById('countHujin').textContent = counts['風神瞳'];
  document.getElementById('countIwagami').textContent = counts['岩神瞳'];
  document.getElementById('countRaijin').textContent = counts['雷神瞳'];
  document.getElementById('countSoushin').textContent = counts['草神瞳'];
  document.getElementById('countSuijin').textContent = counts['水神瞳'];
  document.getElementById('countEnshin').textContent = counts['炎神瞳'];
  document.getElementById('countChallenge').textContent = counts['チャレンジ'];
  document.getElementById('countSenrei').textContent = counts['仙霊'];
  document.getElementById('countSekihi').textContent = counts['元素石碑'];
  document.getElementById('countSquare').textContent = counts['立方体'];
  document.getElementById('countKey1').textContent = counts['鍵紋1'];
  document.getElementById('countKey2').textContent = counts['鍵紋2'];
  document.getElementById('countKey3').textContent = counts['鍵紋3'];
  document.getElementById('countKey4').textContent = counts['鍵紋4'];
  document.getElementById('countKey5').textContent = counts['鍵紋5'];
  document.getElementById('countElectroSeelie').textContent = counts['雷霊'];
  document.getElementById('countArannara').textContent = counts['アランナラ'];
  document.getElementById('countSGimmick').textContent = counts['スメールギミック'];
  document.getElementById('countLeaf').textContent = counts['リーフコア'];
  document.getElementById('countDai').textContent = counts['短火装置'];
  document.getElementById('countShiki').textContent = counts['死域'];
  document.getElementById('countHutu').textContent = counts['普通の宝箱'];
  document.getElementById('countSeikou').textContent = counts['精巧な宝箱'];
  document.getElementById('countKityo').textContent = counts['貴重な宝箱'];
  document.getElementById('countGouka').textContent = counts['豪華な宝箱'];
  document.getElementById('countTinki').textContent = counts['珍奇な宝箱'];
  console.log('Counts updated:', counts);
}

// 印のカウント更新（取得済みの宝箱のみ）
function updateSealCounts() {
  console.log('updateSealCounts called');
  const seals = {
    mondstadt: 0,
    liyue: 0,
    inazuma: 0,
    sumeru: 0,
    fontaine: 0,
    natlan: 0
  };
  pins.forEach(pin => {
    if (chestSeals[pin.icon] !== undefined && pin.obtained === true) {
      seals[pin.area] += chestSeals[pin.icon];
    }
  });
  document.getElementById('sealMondstadt').textContent = seals['mondstadt'];
  document.getElementById('sealLiyue').textContent = seals['liyue'];
  document.getElementById('sealInazuma').textContent = seals['inazuma'];
  document.getElementById('sealSumeru').textContent = seals['sumeru'];
  document.getElementById('sealFontaine').textContent = seals['fontaine'];
  document.getElementById('sealNatlan').textContent = seals['natlan'];

  $('.seal-item').removeClass('active');
  $(`#seal${currentArea.charAt(0).toUpperCase() + currentArea.slice(1)}`).parent().addClass('active');
  console.log('Seal counts updated:', seals);
}

// 画像と動画のプレビュー
$('#pinImage').on('input', function () {
  const url = $(this).val();
  $('#imagePreview').attr('src', url).toggle(!!url);
});
$('#pinVideo').on('input', function () {
  const url = $(this).val();
  $('#videoPreview').attr('src', url.replace('watch?v=', 'embed/')).toggle(!!url);
});

// モーダル表示時のプレビュー更新
function updatePreviews() {
  const imageUrl = $('#pinImage').val();
  const videoUrl = $('#pinVideo').val();
  $('#imagePreview').attr('src', imageUrl).toggle(!!imageUrl);
  $('#videoPreview').attr('src', videoUrl.replace('watch?v=', 'embed/')).toggle(!!videoUrl);
}

// ピンのエクスポート
$('#exportPins').on('click', function () {
  console.log('Export pins called');
  try {
    const data = { pins, lines, visibleIcons };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pins.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('Data exported successfully');
  } catch (err) {
    console.error('Error exporting data:', err);
  }
});

// ピンのインポート
$('#importTrigger').on('click', function () {
  console.log('Import pins triggered');
  const fileInput = document.getElementById('importPins');
  if (!fileInput.files.length) {
    console.warn('No file selected for import');
    return;
  }
  const file = fileInput.files[0];
  if (!file.name.endsWith('.json')) {
    console.warn('Invalid file type, expected .json');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.pins)) {
        console.warn('Imported pins is not an array');
        return;
      }
      pins = data.pins;
      lines = Array.isArray(data.lines) ? data.lines : [];
      Object.assign(visibleIcons, data.visibleIcons || {});
      Object.keys(pinIcons).forEach(icon => {
        if (visibleIcons[icon] === undefined) visibleIcons[icon] = true;
      });
      localStorage.setItem('pins', JSON.stringify(pins));
      localStorage.setItem('lines', JSON.stringify(lines));
      localStorage.setItem('visibleIcons', JSON.stringify(visibleIcons));
      initVisibilityControls();
      refreshMap();
      updateCounts();
      updateSealCounts();
      fileInput.value = '';
      console.log('Data imported successfully:', pins.length, lines.length);
    } catch (err) {
      console.error('Error importing data:', err);
    }
  };
  reader.onerror = function () {
    console.error('Error reading file');
  };
  reader.readAsText(file);
});

// 初期ピンの読み込み
pins.forEach((pin, index) => addPinToMap(pin, index));

// 初期カウント
updateCounts();
updateSealCounts();
