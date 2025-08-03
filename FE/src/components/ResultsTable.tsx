import { Table, Title, Paper } from '@mantine/core';

// template data để hiển thị giao diện
const mockData = {
  totalAchievedScore: 8.5,
  totalMaxScore: 10,
  details: [
    { criterion: 'Tên file đúng cấu trúc', maxScore: 0.5, achievedScore: 0.5, reason: 'Tên file tuân thủ đúng quy ước.' },
    { criterion: 'Sử dụng Animation', maxScore: 1.0, achievedScore: 0.5, reason: 'Có sử dụng animation nhưng chưa đa dạng.' },
  ]
};

export function ResultsTable({ result = mockData }) {
  const rows = result.details.map((item, index) => (
    <Table.Tr key={index}>
      <Table.Td>{item.criterion}</Table.Td>
      <Table.Td>{item.achievedScore} / {item.maxScore}</Table.Td>
      <Table.Td>{item.reason}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper withBorder shadow="md" p="md" mt="xl" radius="md">
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