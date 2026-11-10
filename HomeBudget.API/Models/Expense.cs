using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HomeBudget.API.Models
{
    public class Expense
    {
        public int Id { get; set; }

        public int FamilyMemberId { get; set; }

        public FamilyMember FamilyMember { get; set; } = null!;

        public int ExpenseCategoryId { get; set; }

        public ExpenseCategory ExpenseCategory { get; set; } = null!;

        [Column(TypeName = "decimal(18,3)")]
        [Range(typeof(decimal), "0.001", "999999999999999.999")]
        public decimal Amount { get; set; }

        public DateTime ExpenseDate { get; set; } = DateTime.Today;

        [MaxLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}