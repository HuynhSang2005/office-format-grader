import { Table, Title, Paper } from '@mantine/core';
import type { GradingResult } from '../types/api.types'; 


export function ResultsTable({ result }: { result: GradingResult }) {
  if (!result || !result.details) {
    return null;
  }

  const rows = result.details.map((item, index) => (
    <Table.Tr key={index}>
      <Table.Td>{item.criterion}</Table.Td>
      <Table.Td>{item.achievedScore} / {item.maxScore}</Table.Td>
      <Table.Td>{item.reason}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper withBorder shadow="md" p="md" mt="xl" radius="md" w="100%">
        <Title order={3} mb="md">Kết Quả Chấm Điểm</Title>
        <Title order={4} c="blue">
            Tổng điểm: {result.totalAchievedScore} / {result.totalMaxScore}
        </Title>
        <Table mt="md" striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Tiêu chí</Table.Th>
                    <Table.Th>Điểm</Table.Th>
                    <Table.Th>Lý do / Nhận xét</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
        </Table>
    </Paper>
  );
}