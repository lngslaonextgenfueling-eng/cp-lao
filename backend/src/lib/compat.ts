type Specs = Record<string, any>;

export interface BuildParts {
  cpu?: { name: string; specs: Specs } | null;
  mainboard?: { name: string; specs: Specs } | null;
  ram?: { name: string; specs: Specs } | null;
  gpu?: { name: string; specs: Specs } | null;
  psu?: { name: string; specs: Specs } | null;
  case?: { name: string; specs: Specs } | null;
}

export interface CompatResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  estimatedWatts: number;
  recommendedPsuWatts: number;
}

const FORM_ORDER = ["Mini-ITX", "Micro-ATX", "ATX", "E-ATX"];

/**
 * Rules checked:
 *  - CPU socket == mainboard socket
 *  - RAM type (DDR4/DDR5) == mainboard RAM type
 *  - RAM modules count <= mainboard slots
 *  - PSU wattage >= estimated system draw + headroom
 *  - Case supports the mainboard form factor
 *  - GPU length fits the case
 */
export function checkCompatibility(p: BuildParts): CompatResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (p.cpu && p.mainboard) {
    if (p.cpu.specs.socket !== p.mainboard.specs.socket) {
      errors.push(
        `ຊັອກເກັດບໍ່ເຂົ້າກັນ: CPU ໃຊ້ ${p.cpu.specs.socket} ແຕ່ Mainboard ຮອງຮັບ ${p.mainboard.specs.socket}`
      );
    }
  }

  if (p.ram && p.mainboard) {
    if (p.ram.specs.ramType !== p.mainboard.specs.ramType) {
      errors.push(
        `ປະເພດ RAM ບໍ່ເຂົ້າກັນ: RAM ເປັນ ${p.ram.specs.ramType} ແຕ່ Mainboard ໃຊ້ ${p.mainboard.specs.ramType}`
      );
    }
    const modules = Number(p.ram.specs.modules ?? 1);
    const slots = Number(p.mainboard.specs.ramSlots ?? 4);
    if (modules > slots) {
      errors.push(`RAM ມີ ${modules} ແຜ່ນ ແຕ່ Mainboard ມີພຽງ ${slots} ຊ່ອງ`);
    }
  }

  if (p.cpu && p.ram && p.cpu.specs.ramTypes && !p.cpu.specs.ramTypes.includes(p.ram.specs.ramType)) {
    errors.push(`CPU ນີ້ບໍ່ຮອງຮັບ RAM ${p.ram.specs.ramType}`);
  }

  if (p.case && p.mainboard) {
    const boardIdx = FORM_ORDER.indexOf(p.mainboard.specs.formFactor);
    const maxIdx = FORM_ORDER.indexOf(p.case.specs.maxBoard);
    if (boardIdx > -1 && maxIdx > -1 && boardIdx > maxIdx) {
      errors.push(
        `ເຄສບໍ່ຮອງຮັບ Mainboard ຂະໜາດ ${p.mainboard.specs.formFactor} (ຮອງຮັບສູງສຸດ ${p.case.specs.maxBoard})`
      );
    }
  }

  if (p.case && p.gpu) {
    const len = Number(p.gpu.specs.lengthMm ?? 0);
    const max = Number(p.case.specs.maxGpuMm ?? 9999);
    if (len > max) {
      errors.push(`ກາດຈໍຍາວ ${len}mm ເກີນທີ່ເຄສຮອງຮັບ (${max}mm)`);
    }
  }

  const estimatedWatts =
    Number(p.cpu?.specs.tdp ?? 0) + Number(p.gpu?.specs.tdp ?? 0) + (p.mainboard || p.ram ? 80 : 0);
  const recommendedPsuWatts = Math.ceil((estimatedWatts * 1.3) / 50) * 50;

  if (p.psu) {
    const w = Number(p.psu.specs.wattage ?? 0);
    if (w < estimatedWatts) {
      errors.push(`ພາວເວີຊັບພລາຍ ${w}W ບໍ່ພໍ (ໃຊ້ໄຟປະມານ ${estimatedWatts}W)`);
    } else if (w < recommendedPsuWatts) {
      warnings.push(`ແນະນຳ PSU ຢ່າງໜ້ອຍ ${recommendedPsuWatts}W ເພື່ອໃຫ້ມີພື້ນທີ່ສຳຮອງ (ຕອນນີ້ ${w}W)`);
    }
  }

  if (!p.cpu || !p.mainboard || !p.ram || !p.psu) {
    warnings.push("ຍັງເລືອກຊິ້ນສ່ວນຫຼັກບໍ່ຄົບ (CPU, Mainboard, RAM, PSU)");
  }

  return { ok: errors.length === 0, errors, warnings, estimatedWatts, recommendedPsuWatts };
}
