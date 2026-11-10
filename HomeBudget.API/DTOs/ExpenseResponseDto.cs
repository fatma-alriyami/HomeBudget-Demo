namespace HomeBudget.API.DTOs
{
    public class ExpenseResponseDto
    {
        public int Id { get; set; }

        public int FamilyMemberId { get; set; }

        public string FamilyMemberName { get; set; } = string.Empty;

        public int ExpenseCategoryId { get; set; }

        public string ExpenseCategoryName { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public DateTime ExpenseDate { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}