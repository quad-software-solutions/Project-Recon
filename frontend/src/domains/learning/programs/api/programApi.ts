import { ROBOTICS_PROGRAMS } from '../../../../shared/constants/mock-data';
export async function getPrograms() {
  await new Promise(r => setTimeout(r, 200));
  return ROBOTICS_PROGRAMS;
}
export async function getProgramById(id: string) {
  await new Promise(r => setTimeout(r, 100));
  return ROBOTICS_PROGRAMS.find(p => p.id === id);
}
